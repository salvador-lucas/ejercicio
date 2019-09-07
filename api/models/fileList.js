"use strict";
const mongoose = require('mongoose');

const fileList = mongoose.Schema({
	//_id: mongoose.Schema.Types.ObjectId,
	file_name: String,
	status: String,
	message: String,
	started: String,
	finished: String
}, { collection: 'fileList'});

module.exports = mongoose.model('fileList', fileList);