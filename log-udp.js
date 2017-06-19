'use strict';

const util    = require('util');
const winston = require('winston');

const dgram  = require('dgram');
const client = dgram.createSocket('udp4');

const microtime = require('microtime');

let UdpLog = function(options) {
	options = options || {};

	this.level      = options.level || 'info';
	this.host       = options.host;
	this.port       = options.port;
	this.colorize   = options.colorize || false;
	this.project    = options.project;
	this.logname    = options.logname;
	this.hostname   = options.hostname;
	this._sk        = options.secret;
	this.onResp     = options.onResp;
	this.timeout    = options.timeout || 5000;

	this.logFormat  = options.logFormat || function(level, message) {
		return message;
	};

	if (! this.host || ! this.port || ! this.project) {
		throw new Error('Missing required parameters: url and project');
	}
};

util.inherits(UdpLog, winston.Transport);

winston.transports.UdpLog = UdpLog;

exports.UdpLog = UdpLog;

UdpLog.prototype.log = function(level, msg, meta, callback) {
	if (typeof (meta) === 'function' && ! callback) {
		callback = meta;
		meta = false;
	}

	if (meta && typeof meta === 'object' && Object.keys(meta).length === 0) {
		meta = false;
	}

	let output = msg;

	if (typeof (output) !== 'string') {
		output = util.inspect(output, false, null, this.colorize);
	}

	if (meta) {
		if (typeof meta !== 'object') {
			output += ' ' + meta;
		} else {
			output += '\n' + util.inspect(meta, false, null, this.colorize);
		}
	}

	this.sendMessage(level, output);

	callback(null, true);
};

UdpLog.prototype.sendMessage = function(level, message) {
	let data = {
		project   : this.project,
		logname   : this.logname,
		hostname  : this.hostname,
		level     : level,
		timestamp : Date.now(),
		microtime : microtime.now(),
		message   : this.logFormat(level, message),
		_sk       : this._sk
	};

	let json = JSON.stringify(data);
	json = new Buffer(json).toString('base64');

	client.send(json, 0, json.length, this.port, this.host, () => {
		this.onResp && this.onResp(data);
	});
};