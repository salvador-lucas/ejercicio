'use strict';


var config = require('../config.json');
var supertest = require('supertest');
var should = require('should');
var server = supertest.agent("http://localhost:3000/");
var data = require('../test_data/user_data.json');

var token;

// USER TESTS
describe('Testing entrypoint: POST /user/login/', function () {
	it('login unregistered user, should return 401', function (done) {
		server
		.post("user/login")
		.send(data.wrong_user)
		.expect(401)
		.expect('Content-type', /json/)
		.end(function (err, res) {
			if (err) {
				return done(err);
			}

			res.status.should.equal(401);
			res.body.status.should.equal("failed");

			done();
		});
	});
});

describe('Testing entrypoint: POST /user/signup/', function () {
	it('sign up a new user, should return 200', function (done) {
		server
		.post("user/signup")
		.send(data.new_user)
		.expect(201)
		.expect('Content-type', /json/)
		.end(function (err, res) {
			if (err) {
				return done(err);
			}

			res.status.should.equal(201);
			done();
		});
	});
});

describe('Testing entrypoint: POST /user/login/', function () {
	it('login with the new user created, should return 200', function (done) {
		server
		.post("user/login")
		.send(data.new_user)
		.expect(200)
		.expect('Content-type', /json/)
		.end(function (err, res) {
			if (err) {
				return done(err);
			}

			res.status.should.equal(200);
			res.body.status.should.equal("OK");
			token = res.body.token;

			done();
		});
	});
});



//FILES TESTS
describe('Testing entrypoint: GET /files/list/', function () {
	it('get available files list, should return 200', function (done) {
		server
		.get("files/list?humanreadable=true")
		.set('Authorization', 'Bearer ' + token)
		.expect(200)
		.expect('Content-type', /json/)
		.end(function (err, res) {
			if (err) {
				return done(err);
			}

			res.status.should.equal(200);

			done();
		});
	});
});

describe('Testing entrypoint: GET /files/metrics/', function () {
	it('send process request for file1.tsv, should return 200', function (done) {
		server
		.get("files/metrics?filename=file1.tsv&limit=5")
		.set('Authorization', 'Bearer ' + token)
		.expect(200)
		.expect('Content-type', /json/)
		.end(function (err, res) {
			if (err) {
				return done(err);
			}

			res.status.should.equal(200);

			done();
		});
	});
});

describe('Testing entrypoint: GET /files/metrics/', function () {
	it('get file metrics withouth athorization, should return 401', function (done) {
		server
		.get("files/metrics?filename=file1.tsv&limit=5")
		.expect(401)
		.expect('Content-type', /json/)
		.end(function (err, res) {
			if (err) {
				return done(err);
			}

			res.status.should.equal(401);

			done();
		});
	});
});