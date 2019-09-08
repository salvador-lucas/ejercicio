"use strict";
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const router = express.Router();
const User = require('../models/user');


router.post('/signup', (req, res, next) => {
	User.findOne({email: req.body.email}, function(err, user_result){
		if(err){
			return res.status(500).json({
				Status: "failed",
				Details: err 
			});
		}
		if(user_result !== null){
			return res.status(422).json({
				Status: "failed",
				Message: "email already exists" 
			});
		} else {
			bcrypt.hash(req.body.password, 10, function(err, hash){
				if(err){
					return res.status(500).json({
						Status: "failed",
						Details: err 
					});
				} else {
					var user = new User({
						_id: new mongoose.Types.ObjectId(),
						email: req.body.email,
						password: hash
					});
					user.save(function(err, result){
						if(err){
							return res.status(500).json({
								Status: "failed",
								Message: "Could't create the user",
								Details: err 
							});
						}
						return res.status(201).json({
							Message: "User created"
						});
					});
				}
			});
		}
	});
});


module.exports = router; 