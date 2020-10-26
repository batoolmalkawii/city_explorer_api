'use strict';

const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;
const GEOCODE_API_KEY = process.env.GEOCODE_API_KEY;
//const locationData = require('./data/location.json');
const weatherData = require('./data/weather.json');
const cors = require('cors');
app.use(cors());
const superagent = require('superagent');
require('dotenv').config()

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

function Weather(description, dateTime) {
    this.forecast = description;
    this.dateTime = dateTime;
}

function homePage(request, response) {
    response.status(200).send('Hello! you are in the Home page.');
}

function getLocation(request, response) {
    const city = request.query.city;
    const url = `https://eu1.locationiq.com/v1/search.php?key=${GEOCODE_API_KEY}&q=${city}&format=json`;
    let location;
    superagent.get(url).then(locationData=> {
        location = new Location(city, locationData.body[0]);
        response.json(location);
        console.log(location);
    }).catch(() => {
        response.status(500).send('Something went wrong!');
    });
}

function getWeather(request, response) {
    const weatherArray = weatherData.data.map((value, index) => {
        return(new Weather(value.weather.description, value.datetime));
    });
    response.json(weatherArray);
    handleError(response, weatherArray);
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