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

function getLogger(options, logname, module) {

	let loggerId = `${logname}::${module.filename}`;
	let logger   = loggers[loggerId];

	if (logger) {
		return logger;
	}

	let modulename = path.relative(cwd, module.filename).split('/').slice(-2).join('/');
	let level      = options.level || 'error';

	let transports = [
		new winston.transports.Console({
			colorize  : true,
			timestamp : date => `[${moment(date).format('DD/MM/YYYY - HH:mm:ss:SSS')}]`,
			level     : level,
			label     : `wid=${wid}, pid=${pid}, ${logname}, ${modulename}`
		}),
		new winston.transports.File({
			filename : path.resolve(cwd, `log/${logname}`),
			level    : level,
			json     : false
		})
	];

	if (options.udp) {
		transports.push(new winston.transports.UdpLog({
			level      : level,
			colorize   : true,
			host       : options.udp.host,
			port       : options.udp.port,
			secret     : options.udp.secret,
			project    : options.udp.store.project,
			hostname   : options.udp.store.hostname,
			logname    : logname,
			logFormat  : (level, message) => `[wid=${wid}, pid=${pid}, ${modulename}] ${message}`,
			onResp     : options.udp.onResp
		}));
	}

	logger = new winston.Logger({transports});

	loggers[loggerId] = logger;

	return logger;
}

module.exports = getLogger;