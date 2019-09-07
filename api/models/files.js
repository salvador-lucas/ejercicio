"use strict";
const mongoose = require('mongoose');
mongoose.set('useCreateIndex', true);

const filesSchema = mongoose.Schema({
	_id: mongoose.Schema.Types.ObjectId,
	User_id: { type: [String], index: true },
	segments: String,
	country: { type: [String], index: true }
});

//module.exports = mongoose.model('files', filesSchema);
module.exports = filesSchema;