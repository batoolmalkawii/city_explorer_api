'use strict';

const express = require('express');
const app = express();
require('dotenv').config()
const PORT = process.env.PORT || 3000;
const GEOCODE_API_KEY = process.env.GEOCODE_API_KEY;
const WEATHER_API_KEY = process.env.WEATHER_API_KEY;
const TRAIL_API_KEY = process.env.TRAIL_API_KEY;
const DATABASE = process.env.DATABASE;
const cors = require('cors');
app.use(cors());
const superagent = require('superagent');
const pg = require('pg');
const { request, response } = require('express');
const client = new pg.Client(DATABASE);

app.get('/get-people', (request, response) => {
  const selectPeople = 'SELECT * FROM city_explorer_info;';
  client.query(selectPeople).then(result => {
    response.status(200).json(result.rows);
  })
});

app.get('/add-person', (request, response => {
  const firstName = request.query.first_name;
  const lastName = request.query.last_name;
  const newValues = 'INSERT INTO people_info (first_name, last_name) VALUES ($1, $2);';
  const safeValues = [firstName, lastName];
  client.query(newValues, safeValues).then(result => {
    response.status(200).json(result.rows);
  })
}));

client.connect().then(() => {
  app.listen(PORT, () => console.log(`App is listening on port ${PORT}`));
}).catch(error => {
  console.log('error', error)
});

app.get('/', homePage);
app.get('/location', getLocation);
app.get('/weather', getWeather);
app.get('/trails', getTrails);
app.use('*', getError);

function Location(city, locationData) {
  this.search_query = city;
  this.formatted_query = locationData.display_name;
  this.latitude = locationData.lat;
  this.longitude = locationData.lon;
}

function Weather(weatherData) {
  this.forecast = weatherData.weather.description;
  this.dateTime = weatherData.dateTime;
}

function Trail(trailsData) {
  this.name = trailsData.name;
  this.location = trailsData.location;
  this.length = trailsData.length;
  this.stars = trailsData.stars;
  this.star_votes = trailsData.starVotes;
  this.summary = trailsData.summary;
  this.trail_url = trailsData.url;
  this.conditions = trailsData.conditionStatus;
  let conditionsInfo = trailsData.conditionDate.split(' ');
  this.condition_date = conditionsInfo[0];
  this.condition_time = conditionsInfo[1];

}

function homePage(request, response) {
  response.status(200).send('Hello! you are in the Home page.');
}

function getLocation(request, response) {
  const city = request.query.city;
  let selectLocation = 'SELECT * FROM location WHERE search_query = $1;';
  let safeValuesSelect = [city];
  client.query(selectLocation, safeValuesSelect).then(result => {
    if (result.rows.length > 0) {
      response.status(200).json(result.rows);
    }
    else {
      const url = `https://eu1.locationiq.com/v1/search.php?key=${GEOCODE_API_KEY}&q=${city}&format=json`;
      let location;
      superagent.get(url).then(locationData => {
        location = new Location(city, locationData.body[0]);
        const newLocation = 'INSERT INTO location (search_query, formatted_query, latitude, longitude) VALUES ($1, $2, $3, $4);';
        const safeValuesInsert = [city, location.formatted_query, location.latitude, location.longitude];
        client.query(newLocation, safeValuesInsert).then(result => {
          response.status(200).json(location);
        }).catch(() => {
          response.status(500).send('Something Went Wrong');
        })
      }).catch(() => {
        response.status(500).send('Something Went Wrong');
      })
    }
  }).catch(() => {
    response.status(500).send('Something Went Wrong');
  })
}

function getWeather(request, response) {
  const city = request.query.search_query;
  const longitude = request.query.longitude;
  const latitude = request.query.latitude;
  const url = `https://api.weatherbit.io/v2.0/forecast/daily?city=${city}&lat=${latitude}&lon=${longitude}&key=${WEATHER_API_KEY}`;
  let weather = [];
  superagent.get(url).then(weatherData => {
    weather = weatherData.body.data.map((value, index) => {
      return (new Weather(value));
    });
    response.json(weather);
  }).catch(() => {
    response.status(500).send('Something Went Wrong');
  })
}

function getTrails(request, response) {
  const longitude = request.query.longitude;
  const latitude = request.query.latitude;
  const url = `https://www.hikingproject.com/data/get-trails?lat=${latitude}&lon=${longitude}&key=${TRAIL_API_KEY}`;
  let trails = [];
  superagent.get(url).then(trailsData => {
    trails = trailsData.body.trails.map((value, index) => {
      return (new Trail(value));
    });
    response.json(trails);
  }).catch(() => {
    response.status(500).send('Something Went Wrong');
  })
}

function getError(request, response) {
  response.status(404).send('Not found');
}

function handleError(response, data) {
  if (response.status == 200) {
    response.status(200).send(data);
  }
  else {
    response.status(500).send('Some Error Occurred')
  }
}

