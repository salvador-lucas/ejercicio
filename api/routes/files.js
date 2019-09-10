"use strict";
const express 	= require('express');
const fs 		= require("fs");
const path 		= require('path');
const async 	= require('async');
const router 	= express.Router();
const mongoose 	= require('mongoose');
const FileSchema = require('../models/files');
const csvSchema = require('../models/csvSchema');
const FileList 	= require('../models/fileList');
const moment 	= require('moment');
const readline 	= require('readline');
const stream 	= require('stream');
const auth 		= require('../middleware/auth');
const events	= require('events');

var EventEmitter = new events();
var workingPath = path.join(__dirname, '../../material/');

router.get('/list', auth, (req, res, next) => {
	let response = [];
    fs.readdir(workingPath, function (err, files) {
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
				res.status(200).json({
					response
				});
			});
	    }
	});
});

router.get('/metrics', auth, (req, res, next) => {
	let file_name = req.query.filename;
	if(typeof file_name === "undefined" || file_name == ""){
		return res.status(400).json({
			status: "failed",
			message: "filename param is required",
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
							file_name: file_name,
							status: "failed",
							message: "File doesnt exists"
						});
					});

			    } else { //si existe
					let started_time = moment().format("YYYY-MM-DDTHH:mm:ss");
					EventEmitter.emit('storeDataMongo', file_name);
					EventEmitter.emit('updateFilestatus', file_name, "processing", started_time);
					return res.status(200).json({
						file_name: file_name,
						status: "started",
						started: started_time
					});
			    }
			});
		}
		else if(result.status == "processing"){
			console.log(result.status);
			return res.status(200).json({
				file_name: file_name,
				status: result.status,
				started: result.started
			});
		}

		else if(result.status == "ready"){
			console.log(result.status);
			performAggregate(file_name, req.query, function (error, file_metrics){
				if(error){
					return res.status(500).json({
						file_name: file_name,
						status: "failed",
						message: error.errmsg
					});
				}
				return res.status(200).json({
					file_name: file_name,
					status: result.status,
					started: result.started,
					finished: result.finished,
					metrics: file_metrics
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

router.get('/data', auth, (req, res, next) =>{
	let file_name = req.query.filename;
	if(typeof file_name === "undefined" || file_name == ""){
		file_name = "csvFile.csv"; // se usa el archivo del ej por defecto
	}
	FileList.findOne({file_name: file_name}, function(err, result){
		if(err){
			 return res.status(500).json({
				message: err.message
			});
		}
		if(result === null){
			storeCsvData(file_name, function(err, result){ //se manda a procesar el archivo
				if(err){
					 return res.status(500).json({
						status: "failed",
						message: err.errmsg
					});
				} else {
					performDataQuery(file_name, req.query, function(err, result){
						if(err){
							 return res.status(500).json({
								status: "failed",
								message: err
							});
						} else {
							return res.status(200).json({
								status: result
							});
						}
					});
				}
			});
		} else if (result.status == "ready"){
			performDataQuery(file_name, req.query, function(err, result){
				if(err){
					 return res.status(500).json({
						status: "failed",
						message: err
					});
				} else {
					return res.status(200).json({
						status: result
					});
				}
			});
		}
	});
});


//-------------EVENTS-------------
EventEmitter.on('storeDataMongo', function (file_name) {
	let instream  = fs.createReadStream(workingPath + file_name);
	let outstream = new stream();
	let lineCount = 0;
	let rl 		  = readline.createInterface(instream, outstream);
	let segments  = [];
	let File  = mongoose.model(file_name.replace(/\.[^/.]+$/, ""), FileSchema);
	let bulk  = File.collection.initializeOrderedBulkOp();
	let title = {
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
			EventEmitter.emit('mongobulk', bulk, file_name);
			bulk = File.collection.initializeOrderedBulkOp();
			lineCount = 0;
	    }
		lineCount++;
	});

	rl.on('close', function(err, res){
		//insertar si quedo algun reg pendiente
		if (lineCount > 0){
			EventEmitter.emit('mongobulk', bulk, file_name);
			let finished = moment().format("YYYY-MM-DDTHH:mm:ss");
			EventEmitter.emit('updateFilestatus', file_name, "ready", null, finished);
		}
	});
});

EventEmitter.on('mongobulk', function (bulk, file_name) {
	bulk.execute(function(err) {
		if(err){
			console.log(err);
			EventEmitter.emit('updateFilestatus', file_name, "failed. details: " + err);
		}
    });
});

EventEmitter.on('updateFilestatus', function (file_name, status, started=null, finished=null){
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


//-------------FUNCTIONS-------------
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

function fileSize(size) {
    var i = Math.floor(Math.log(size) / Math.log(1024));
    return (size / Math.pow(1024, i)).toFixed(2) * 1 + ''+[' B', ' kB', ' MB', ' GB', ' TB'][i];
}

function storeCsvData(file_name, callback){
	let instream  = fs.createReadStream(workingPath + file_name);
	let outstream = new stream()
	let rl 		  = readline.createInterface(instream, outstream);
	let csvFile   = mongoose.model(file_name.replace(/\.[^/.]+$/, ""), csvSchema);
	let bulk  	  = csvFile.collection.initializeOrderedBulkOp();
	let lineCount = 0;
	var bulkOps = [ ];
	let title = {
		name: 	  "name",
		segment1: "segment1",
		segment2: "segment2",
		segment3: "segment3",
		segment4: "segment4",
		platformId: "platformId",
		clientId: "clientId"
	};
	EventEmitter.emit('updateFilestatus', file_name, "processing");
	rl.on('line', function(line) {
		if(lineCount == 0){
			lineCount++;
		} else {
			line = line.split(",");
			let insert_data = {
				[title.name]: 	    line[0],
				[title.segment1]:  	line[1],
				[title.segment2]:  	line[2],
				[title.segment3]:  	line[3],
				[title.segment4]:  	line[4],
				[title.platformId]: line[5],
				[title.clientId]:   line[6]
			};

			let upsertDoc = {
		    	'updateOne': {
				'filter': { 'clientId': line[6], 'platformId': line[5] },
				'update': insert_data,
				'upsert': true
		    }};
		    bulkOps.push(upsertDoc);
		    lineCount++;
		}
		
	});

	rl.on('close', function(err, res){
		if(err){
			return callback(err);
		}
		csvFile.collection.bulkWrite(bulkOps, function(err, result){
			if(err){
				return callback(err);
			}
			EventEmitter.emit('updateFilestatus', file_name, "ready");
			return callback(null, result);
		});
	});
}


function performDataQuery(file_name, query_params, callback){
	let csvFile   = mongoose.model(file_name.replace(/\.[^/.]+$/, ""), csvSchema);
	let fields = ["-_id"];
	let query_limit = 10;
	let query_sort  = {};
	//params
	if(typeof query_params.fields !== "undefined" && query_params.fields !== null){
		try{
			fields = JSON.parse(query_params.fields);
		} catch(error){
			fields = query_params.fields.split(",");	
		}
		fields.push("-_id");
	}
	//limit
	if(typeof query_params.limit !== "undefined" && query_params.limit !== null){
		query_limit = parseInt(query_params.limit);
		if(isNaN(query_limit)){
			return callback("limit value must be a number");
		}
	}
	//sortField
	if(typeof query_params.sortField !== "undefined" && query_params.sortField !== null){
		query_sort = {
			[query_params.sortField]: 1 //asc por defecto
		}
		if(typeof query_params.sort !== "undefined" && query_params.sort !== null){
			if(query_params.sort.toLowerCase() == "desc"){
				query_sort = {
					[query_params.sortField]: -1
				}
			}
		} else {
			query_sort = {
				[query_params.sortField]: 1 //asc por defecto
			}
		}
	}
	csvFile.find({},
		fields,
		{
		    limit: query_limit,
		    // sort: query_sort
		    sort: query_sort
		},
		function(err,result){
		    if(err){
		    	return callback(err);
		    }
		    return callback(null, result);
		}
	);
}

module.exports = router;