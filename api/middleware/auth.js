"use strict"; 
const jwt = require('jsonwebtoken');



module.exports = (req, res, next) => {
	let token = "";
	if(typeof req.headers.authorization !== "undefined" && req.headers.authorization !== null){
		token = req.headers.authorization.split(" ")[1];
	}
 	var decoded_jwt = jwt.verify(token, "secret_key_pasar a config", function(err, result){
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

// [{"key": "token", "value": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImhvbG9AbWFpbC5jb20iLCJpYXQiOjE1Njc5MDY5MjIsImV4cCI6MTU2NzkxMDUyMn0.mWF1pSEVQkykT5ldLdkE99NlHc27XgnxIdahXWKovjQ", "description": ""]