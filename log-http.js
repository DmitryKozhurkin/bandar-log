'use strict';

const util    = require('util');
const unirest = require('unirest');
const winston = require('winston');

class HttpLog extends winston.Transport {
	constructor (options) {
		super();

		options = options || {};

		this.level      = options.level || 'info';
		this.url        = options.url;
		this.colorize   = options.colorize || false;
		this.project    = options.project;
		this.logname    = options.logname;
		this.hostname   = options.hostname;
		this._sk        = options.secret;
		this.onResp     = options.onResp;
		this.timeout    = options.timeout || 5000;

		this.logFormat  = options.logFormat || ((level, message) => message);

		if (! this.url || ! this.project) {
			throw new Error('Missing required parameters: url and project');
		}
	}

	log (level, msg, meta, callback) {
		if (typeof meta === 'function' && ! callback) {
			callback = meta;
			meta = false;
		}

		if (meta && typeof meta === 'object' && Object.keys(meta).length === 0) {
			meta = false;
		}

		let output = msg;

		if (typeof output !== 'string') {
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
	}

	sendMessage (level, message) {
		let data = {
			project   : this.project,
			logname   : this.logname,
			hostname  : this.hostname,
			level     : level,
			timestamp : Date.now(),
			message   : this.logFormat(level, message),
			_sk       : this._sk
		};

		unirest.post(this.url)
			.timeout(this.timeout)
			.send(data)
			.end(response => {
				this.onResp && this.onResp(response, data);
			});
	}
};

winston.transports.HttpLog = HttpLog;

module.exports = HttpLog;
