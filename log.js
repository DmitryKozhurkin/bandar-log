'use strict';

const path    = require('path');
const cluster = require('cluster');
const winston = require('winston');
const moment  = require('moment');
const UdpLog  = require('./log-udp');

const cwd = process.cwd();
const wid = cluster.isMaster ? 'master': `000${cluster.worker.id}`.slice(-2);
const pid = process.pid;

const loggers = {};

const TRANSPORT = {
	CONSOLE : 1,
	FILE    : 2,
	UDP     : 4
};

function getLogger(options, logname, module) {

	let loggerId = `${logname}::${module.filename}`;
	let logger   = loggers[loggerId];

	if (logger) {
		return logger;
	}

	let modulename = path.relative(cwd, module.filename).split('/').slice(-2).join('/');
	let level      = options.level || 'error';
	let label      = options.label || `wid=${wid}, pid=${pid}, ${logname}, ${modulename}`;
	let timestamp  = (date) => `[${moment(date).format('DD/MM/YYYY - HH:mm:ss:SSS')}]`;
	let logFormat  = (level, message) => `[wid=${wid}, pid=${pid}, ${modulename}] ${message}`;

	let transports = [];

	for (let transport of options.transports) {

		if (! transport) {
			continue;
		}

		switch (transport.type) {

			case TRANSPORT.CONSOLE:
				transports.push(new winston.transports.Console({
					colorize  : true,
					timestamp : transport.timestamp || timestamp,
					level     : transport.level || level,
					label     : transport.label || label
				}));
				break;

			case TRANSPORT.FILE:
				const logdir = transport.dir || 'log';
				transports.push(new winston.transports.File({
					timestamp : transport.timestamp || timestamp,
					filename  : path.resolve(cwd, logdir, logname),
					level     : transport.level || level,
					label     : transport.label || label,
					json      : false
				}));
				break;

			case TRANSPORT.UDP:
				transports.push(new winston.transports.UdpLog({
					level      : transport.level || level,
					colorize   : true,
					host       : transport.host,
					port       : transport.port,
					secret     : transport.secret,
					project    : transport.store.project,
					hostname   : transport.store.hostname,
					logname    : logname,
					logFormat  : transport.logFormat || logFormat,
					onResp     : transport.onResp
				}));
				break;
		}
	}

	logger = loggers[loggerId] = new winston.Logger({transports});

	return logger;
}

module.exports = getLogger;
module.exports.TRANSPORT = TRANSPORT;
