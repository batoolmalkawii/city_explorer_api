'use strict';

const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;
const locationData = require('./data/location.json');
const weatherData = require ('./data/weather.json');
const cors = require('cors');
app.use(cors());
require('dotenv').config()

app.get('/', (request, response)=>{
    response.status(200).send('Hello! you are in the Home page.');
});

app.get('/location', (request, response)=>{
    const city = request.query.city;
    let locationData = locationData[0];
    let location = new Location(city, locationData);
    });
    response.json(location);
    handleError(response, location);
});

app.get('/weather', (request, response)=>{
    let weather = [];
    weatherData.data.forEach(weatherData=>{
        let description = weatherData.weather.description;
        console.log(description);
        let dateTime = weatherData.datetime;
        console.log(dateTime);
        weather.push(new Weather(description, dateTime));
    });
    response.json(weather);
    handleError(response, weather);
});

function Location(city, locationData){
    this.search_query = city;
    this.formatted_query = locationData.display_name;
    this.latitude = locationData.lat;
    this.longitude = locationData.lon;
}

function Weather(description, dateTime){
    this.forecast = description;
    this.dateTime = dateTime;
}

function handleError(response, data){
    if(response.status == 200){
        response.status(200).send(data);
    }
    else{
        response.status(500).send('Some Error Occurred')
    }
}

app.use('*', (request, response)=>{
    response.status(404).send('Not found');
})

app.listen(PORT, ()=> console.log(`App is listening on port ${PORT}`));