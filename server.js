"use strict";

const http = require('http');
const app  = require('./app');
const config = require('./config.json')
const port   =  config.server.port;
const server = http.createServer(app);

console.log("server running at port: ", port);

server.listen(port);