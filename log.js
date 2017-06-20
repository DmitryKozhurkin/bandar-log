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

	let transports = [];

	for (let transport of options.transports) {
		switch (transport.type) {

			case TRANSPORT.CONSOLE:
				transports.push(new winston.transports.Console({
					colorize  : true,
					timestamp : date => `[${moment(date).format('DD/MM/YYYY - HH:mm:ss:SSS')}]`,
					level     : transport.level || level,
					label     : `wid=${wid}, pid=${pid}, ${logname}, ${modulename}`
				}));
				break;

			case TRANSPORT.FILE:
				const logdir = transport.dir || 'log';
				transports.push(new winston.transports.File({
					filename : path.resolve(cwd, logdir, logname),
					level    : transport.level || level,
					json     : false
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
					logFormat  : (level, message) => `[wid=${wid}, pid=${pid}, ${modulename}] ${message}`,
					onResp     : transport.onResp
				}));
				break;
		}
	}

	console.log(transports.length);

	logger = loggers[loggerId] = new winston.Logger({transports});

	return logger;
}

module.exports = getLogger;
module.exports.TRANSPORT = TRANSPORT;
