"use strict";
const mongoose = require('mongoose');
mongoose.set('useCreateIndex', true);

const csvSchema = mongoose.Schema({
	_id: mongoose.Schema.Types.ObjectId,
	name: { type: String, index: true },
	segment1: Boolean,
	segment2: Boolean,
	segment3: Boolean,
	segment4: Boolean,
	platformId: String,
	clientId: { type: String, index: true }
});

// module.exports = mongoose.model('csvSchema', csvSchema);
module.exports = csvSchema;