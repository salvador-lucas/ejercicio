"use strict";
const mongoose = require('mongoose');

const userSchema = mongoose.Schema({
	_id: mongoose.Schema.Types.ObjectId,
	email: { type: String, required: true, unique: true },
	password: { type: String, required: true }
}, { collection: 'users'});

module.exports = mongoose.model('user', userSchema);
// module.exports = filesSchema;