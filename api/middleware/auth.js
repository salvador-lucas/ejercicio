"use strict"; 
const jwt = require('jsonwebtoken');
const config = require('../../config.' + process.env.NODE_ENV+ '.json');

module.exports = (req, res, next) => {
	let token = "";
	if(typeof req.headers.authorization !== "undefined" && req.headers.authorization !== null){
		token = req.headers.authorization.split(" ")[1];
	}
 	var decoded_jwt = jwt.verify(token, config.jwt_secretKey, function(err, result){
		if(err){
			return res.status(401).json({
				status: "failed",
				message: "Authorization failed" 
			});
		} else {
			req.userData = decoded_jwt;
			next();
		}
	}); 
};