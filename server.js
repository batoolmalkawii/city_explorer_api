'use strict';

const express = require('express');
const app = express();
require('dotenv').config()
const PORT = process.env.PORT || 3000;
const GEOCODE_API_KEY = process.env.GEOCODE_API_KEY;
const WEATHER_API_KEY = process.env.WEATHER_API_KEY;
//const locationData = require('./data/location.json');
//const weatherData = require('./data/weather.json');
const cors = require('cors');
app.use(cors());
const superagent = require('superagent');

app.get('/', homePage);
app.get('/location', getLocation);
app.get('/weather', getWeather);
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

function homePage(request, response) {
    response.status(200).send('Hello! you are in the Home page.');
}

function getLocation(request, response){
    const city = request.query.city;
    const url = `https://eu1.locationiq.com/v1/search.php?key=${GEOCODE_API_KEY}&q=${city}&format=json`;
    let location;
    superagent.get(url).then(locationData => {
      location = new Location(city, locationData.body[0]);
      response.json(location);
    }).catch(() => {
      response.status(500).send('Something went wrong');
    })
  }

function getWeather(request, response) {
    const city = request.query.search_query;
    const longitude = request.query.longitude;
    const latitude = request.query.latitude;
    console.log(city);
    const url = `https://api.weatherbit.io/v2.0/forecast/daily?city=${city}&lat=${latitude}&lon=${longitude}&key=${WEATHER_API_KEY}`;
    let weather = [];
    superagent.get(url).then(weatherData => {
      weather = weatherData.body.data.map((value) => {
        return (new Weather(value));
      });
      response.json(weather);
    }).catch(() => {
        response.status(500).send('Something went wrong');
      })
}

function getError (request, response) {
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



app.listen(PORT, () => console.log(`App is listening on port ${PORT}`));