'use strict';

const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;
const locationData = require('./data/location.json');
const weatherData = require('./data/weather.json');
const cors = require('cors');
app.use(cors());
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
    let location = new Location(city, locationData[0]);
    response.json(location);
    handleError(response, location);
}

function getWeather(request, response) {
    /*
    let weather = [];
    weatherData.data.forEach(weatherData => {
        let description = weatherData.weather.description;
        let dateTime = weatherData.datetime;
        weather.push(new Weather(description, dateTime));
    });
    */

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