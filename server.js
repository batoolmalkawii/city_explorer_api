'use strict';

const express = require('express');
const app = express();
require('dotenv').config()
const cors = require('cors');
const PORT = process.env.PORT || 3000;
const GEOCODE_API_KEY = process.env.GEOCODE_API_KEY;
const WEATHER_API_KEY = process.env.WEATHER_API_KEY;
const TRAIL_API_KEY = process.env.TRAIL_API_KEY;
const MOVIE_API_KEY = process.env.MOVIE_API_KEY;
const YELP_API_KEY = process.env.YELP_API_KEY;
const DATABASE_URL = process.env.DATABASE_URL;
const superagent = require('superagent');
const pg = require('pg');
const { request, response } = require('express');
const client = new pg.Client(DATABASE_URL);
app.use(cors());

client.connect().then(() => {
  app.listen(PORT, () => console.log(`App is listening on port ${PORT}`));
}).catch(error => {
  console.log('error', error)
});

app.get('/', homePage);
app.get('/location', getLocation);
app.get('/weather', getWeather);
app.get('/trails', getTrails);
app.get('/movies', getMovies);
app.get('/yelp', getYelp);
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

function Movies(moviesData) {
  this.title = moviesData.title;
  this.overview = moviesData.overview;
  this.average_votes = moviesData.vote_average;
  this.total_votes = moviesData.vote_count;
  this.image_url = `https://image.tmdb.org/t/p/w500/${moviesData.poster_path}`;
  this.popularity = moviesData.popularity;
  this.released_on = moviesData.release_date;
}

function Yelp(yelpData) {
  this.name = yelpData.name;
  this.image_url = yelpData.image_url;
  this.price = yelpData.price;
  this.rating = yelpData.rating;
  this.url = yelpData.url;
  console.log(this.name);
  console.log(this.image_url);
  console.log(this.price);
  console.log(this.rating);
  console.log(this.url);
}

function homePage(request, response) {
  response.status(200).send('Hello! you are in the Home page.');
}

function getLocation(request, response) {
  const city = request.query.city;
  let selectLocation = 'SELECT search_query, formatted_query, latitude, longitude FROM location WHERE search_query = $1;';
  let safeValuesSelect = [city];
  client.query(selectLocation, safeValuesSelect).then(result => {
    if (result.rows.length > 0) {
      response.status(200).json(result.rows[0]);
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

function getMovies(request, response) {
  const city = request.query.search_query;
  const url = `https://api.themoviedb.org/3/search/movie/?api_key=${MOVIE_API_KEY}&query=${city}`;
  let movies = [];
  superagent.get(url).then(moviesData => {
    movies = moviesData.body.results.map((value, index) => {
      return (new Movies(value));
    });
    response.json(movies);
  }).catch(() => {
    response.status(500).send('Something Went Wrong');
  })
}

function getYelp(request, response) {
  const url = 'https://api.yelp.com/v3/businesses/search';
  const queryParams = {
    latitude: request.query.latitude,
    longitude: request.query.longitude,
  };
  superagent.get(url).set('Authorization', `Bearer ${YELP_API_KEY}`).query(queryParams).then((yelpData) => {
    let yelp = [];
    console.log(yelpData.body.businesses);
    yelp = yelpData.body.businesses.map((value, index) => {
      return (new Yelp(value));
    });
    response.json(yelp);
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

