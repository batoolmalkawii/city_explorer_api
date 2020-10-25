'use strict';

// Defining Application Dependencies 
const express = require('express');
const cors = require('cors')
require('dotenv').config()


const PORT = process.env.PORT || 3000;

console.log(PORT);

const app = express();
app.use(cors());

// Routes
app.get('/', (reqeust, response)=>{
    response.send('Home Page Welcome to express');
});

app.get('/location', (request, response)=>{
    const locationData = require('./data/location.json');
    const city = request.query.city;
    let location;
    locationData.forEach(locationData=>{
        location = new Location(city, locationData);
    });
    response.json(location);
});

app.use('*', (request, resp)=>{
    resp.status(404).send('Not found');
})


// Constructor
function Location(city, locationData){
    this.search_query=city;
    this.formated_query=locationData.display_name;
    this.latitude = locationData.lat;
    this.longitude = locationData.lon;
}

app.listen(PORT, ()=> console.log(`App is listening on port ${PORT}`));