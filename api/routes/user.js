"use strict";
const express 	= require('express');
const mongoose 	= require('mongoose');
const bcrypt 	= require('bcrypt');
const jwt 		= require('jsonwebtoken');
const router 	= express.Router();
const User 		= require('../models/user');


router.post('/signup', (req, res, next) => {
	User.findOne({email: req.body.email}, function(err, user_result){
		if(err){
			return res.status(500).json({
				status: "failed",
				details: err 
			});
		}
		if(user_result !== null){
			return res.status(422).json({
				status: "failed",
				message: "email already exists" 
			});
		} else {
			bcrypt.hash(req.body.password, 10, function(err, hash){
				if(err){
					return res.status(500).json({
						status: "failed",
						details: err 
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
								status: "failed",
								message: "Could't create the user",
								details: err 
							});
						}
						return res.status(201).json({
							message: "User created"
						});
					});
				}
			});
		}
	});
});


router.post('/login', (req, res, next) => {
	User.findOne({email: req.body.email}, function(err, user_result){
		if(err){
			return res.status(500).json({
				status: "failed",
				details: err 
			});
		}
		if(user_result === null){
			return res.status(401).json({
				status: "failed",
				message: "Authorization failed" 
			});
		}
		bcrypt.compare(req.body.password, user_result.password, function(err, pass_result){
			if(err){
				return res.status(401).json({
					status: "failed",
					message: "Authorization failed" 
				});
			}
			if(pass_result === true){
				var token = jwt.sign({
					email: user_result.email
				}, 
				"secret_key_pasar a config", //PASAr KEY A MONGO
				{expiresIn: "1h"}
				);
				return res.status(200).json({
					status: "OK",
					message: "Authorization successful",
					token: token
				});
			} else {
				return res.status(401).json({
					status: "failed",
					message: "Authorization failed" 
				});
			}
		});
	});
});

module.exports = router; 