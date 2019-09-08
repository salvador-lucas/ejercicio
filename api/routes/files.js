"use strict";
const express = require('express');
const fs = require("fs");
var es = require('event-stream');
const path = require('path');
const async = require('async');
var events = require('events');
var EventEmitter = new events();
const router = express.Router();
const mongoose = require('mongoose');
const FileSchema = require('../models/files');
const FileList = require('../models/fileList');
//var tabson = require('tabson');
const moment = require('moment');
var readline = require('readline');
var stream 	 = require('stream');
const auth = require('../middleware/auth');

var workingPath = path.join(__dirname, '../../material/');

router.get('/', (req, res, next) => {
	res.status(200).json({
		message: 'get files'
	});
});

router.post('/', (req, res, next) => {
	var segment = {
		name: req.body.name
	};
	res.status(200).json({
		message: 'post method files',
		segment: segment
	});
});
router.get('/list', auth, (req, res, next) => {
	let response = [];
	//ver si agregar la lista de archivos en mongo
    fs.readdir(workingPath, function (err, files) {
	    //handling error
	    if (err) {
	        return res.status(500).json({
				message: err.message
			});
	    } else {
	    	async.eachSeries(files, 
			function iterator(file, next){
				var stats = fs.statSync(workingPath + file);
				var size = stats.size;
				if(typeof req.query.humanreadable !== "undefined" && req.query.humanreadable.toLowerCase() === "true"){
		        	size = fileSize(size);

				}
				response.push({
						name: file,
						size: size
					});
				next();
			}, 
			function doneIterate(){
				/*if(err){
					return res.status(500).json({
						message: err.message
					});
				}*/
				res.status(200).json({
					response
				});
			});
	    }
	});
});

router.get('/metrics', (req, res, next) => {
	let file_name = req.query.filename;
	if(typeof file_name === "undefined" || file_name == ""){
		return res.status(400).json({
			Status: "failed",
			Message: "filename param is required",
		});
	}
	FileList.findOne({file_name: file_name}, function(err, result){
		if(err){
			 return res.status(500).json({
				message: err.message
			});
		}

		if(result === null) {
			//está en la lista el archivo??
			fs.access(workingPath + file_name, error => { //no existe
			    if (error) {
			        let files = new FileList({file_name: file_name, status: "failed", message: "file doesnt exists", started: moment().format("YYYY-MM-DDTHH:mm:ss")});
					files.save(function(err, mongo_res){
						return res.status(200).json({
							File_name: file_name,
							Status: "failed",
							Message: "File doesnt exists"
						});
					});

			    } else { //si existe
					let started_time = moment().format("YYYY-MM-DDTHH:mm:ss");
					EventEmitter.emit('storeDataMongo', file_name);
					EventEmitter.emit('updateFileStatus', file_name, "processing", started_time);
					return res.status(200).json({
						File_name: file_name,
						Status: "Started",
						Started: started_time
					});
			    }
			});
		}
		else if(result.status == "processing"){
			console.log(result.status);
			return res.status(200).json({
				File_name: file_name,
				Status: result.status,
				Started: result.started
			});
		}

		else if(result.status == "ready"){
			console.log(result.status);
			performAggregate(file_name, req.query, function (error, file_metrics){
				if(error){
					return res.status(500).json({
						File_name: file_name,
						Status: "failed",
						Message: error.errmsg
					});
				}
				return res.status(200).json({
					File_name: file_name,
					Status: result.status,
					Started: result.started,
					Finished: result.finished,
					Metrics: file_metrics
				});
			});
		}

		else if(result.status == "failed"){
			return res.status(200).json({
				file_name: result.file_name,
				status: result.status,
				message: result.message,
				started: result.started
			});
		}
	});
});


//-------------EVENTOS-------------
EventEmitter.on('storeDataMongo', function (file_name) {
	console.log("storedata");
	let instream = fs.createReadStream(workingPath + file_name);
	let lineCount = 0;
	let outstream = new stream();
	let rl = readline.createInterface(instream, outstream);
	let title = {};
	let segments = [];
	let file = mongoose.model(file_name.replace(/\.[^/.]+$/, ""), FileSchema);
	let bulk = file.collection.initializeOrderedBulkOp();
	title = {
		User_id: 	"User_id",
		segments: 	"segments",
		country: 	"country"
	};
  	rl.on('line', function(line) {
		line = line.split("\t");
		segments = line[1].split(",")
		bulk.insert({ _id: new mongoose.Types.ObjectId(), [title.User_id]: line[0], [title.segments]: segments, [title.country]: line[2]});
		//insertar cada 1000 regs
		if (lineCount % 1000 == 0){
			// mongobulk(bulk);
			EventEmitter.emit('mongobulk', bulk);
			bulk = file.collection.initializeOrderedBulkOp();
			lineCount = 0;
	    }
		lineCount++;
	});

	rl.on('close', function(err, res){
		//insertar si quedo algun reg pendiente
		if (lineCount > 0){
			EventEmitter.emit('mongobulk', bulk);
			let finished = moment().format("YYYY-MM-DDTHH:mm:ss");
			EventEmitter.emit('updateFileStatus', file_name, "ready", null, finished);
		}
	});
});

EventEmitter.on('mongobulk', function (bulk) {
	bulk.execute(function(err) {
		if(err){
			console.log(err);
		}
    });
});

EventEmitter.on('updateFileStatus', function (file_name, status, started=null, finished=null){
	console.log(status);
	let update_params = { status: status };
	if(started != null){
		update_params.started = started;
	};
	if(finished != null){
		update_params.finished = finished;
	};
	FileList.updateMany({file_name: file_name}, { $set: update_params}, {upsert:true}, function(err){
		if(err){
			console.log(err);
		}
	});
});

function performAggregate(file_name, query_params, callback){
	let project = { "$project" : { "segments" : 1, "country":1} };
	let unwind 	= { "$unwind": "$segments"};
	let group 	= { "$group" : 
			        { "_id": 
			            {
			                "segments": "$segments", 
			                "country": "$country" 
			            }, 
			            "count":{"$sum":1}
			        } 
			    };
	let aggregate = [
		project,
		unwind,
		group,
	];
	let sort =  {"$sort" : { "count" : 1 } }; //asc por defecto
	if(typeof query_params.sort !== "undefined" && query_params.sort.toUpperCase() == "DESC"){
			sort =  {"$sort" : { "count" : -1 } };
	}
	aggregate.push(sort);

	if(typeof query_params.limit !== "undefined"){
		if(parseInt(query_params.limit) !== "NaN"){
			var limit =  { "$limit" : parseInt(query_params.limit) };
			aggregate.push(limit);
		}
	}
	let File = mongoose.model(file_name.replace(/\.[^/.]+$/, ""), FileSchema);
	File.aggregate([aggregate],
		function(error, data) {
		if (error){
			return callback(error);
		}
		return callback(null, data);
		}
	);
}

//CASO DE TEST. VER SI PUEDE SERVIR
/*router.get('/hola', (req, res, next) => {
	const id = req.params.segmentId;
	console.log(req.params);
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

function fileSize(size) {
    var i = Math.floor(Math.log(size) / Math.log(1024));
    return (size / Math.pow(1024, i)).toFixed(2) * 1 + ''+['B', 'kB', 'MB', 'GB', 'TB'][i];
}

module.exports = router;