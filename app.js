"use strict";
const express = require('express');
// const morgan = require('morgan');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const config = require('./config.' + process.env.NODE_ENV+ '.json');
const app = express();
const filesRoutes = require('./api/routes/files');
const userRoutes = require('./api/routes/user');

//------db connection------
mongoose.pluralize(null);
mongoose.connect('mongodb://' + config.mongo.host + ':' + config.mongo.port + '/' + config.mongo.db, 
	{useNewUrlParser: true});

mongoose.connection.on('connected', function(){
	console.log("mongodb successfully connected");
});
mongoose.connection.on('error', function(){
	console.log("mongodb connection error");
});
mongoose.connection.on('disconnected', function(){
	console.log("mongodb disconnected");
});

//--------------------------
// app.use(morgan('dev'));
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());


app.use('/user', userRoutes);
app.use('/files', filesRoutes);

app.use((req, res, next) => {
	const error = new Error('Not found');
	error.status = 404;
	next(error);
});


app.use((error, req, res, next) => {
	res.status(error.status || 500);
	res.json({
		error:{
			message: error.message
		}
	});
});


module.exports = app;