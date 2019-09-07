"use strict";
const express = require('express');
const router = express.Router();

router.get('/', (req, res, next) => {
	res.status(200).json({
		message: 'get method segments'
	});
});

router.post('/', (req, res, next) => {
	var segment = {
		name: req.body.name
	};
	res.status(200).json({
		message: 'post method segments',
		segment: segment
	});
});

//CASO DE TEST. VER SI PUEDE SERVIR
/*router.get('/:segmentId', (req, res, next) => {
	const id = req.params.segmentId;
	if(id === 'special'){
		res.status(200).json({
			message: 'test request',
			id: id
		});
	} else {
		res.status(200).json({
			message: 'get method segments'
		});
	}
});*/


module.exports = router;