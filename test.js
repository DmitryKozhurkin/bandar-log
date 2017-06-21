const bandarlog = require('.');
const dgram     = require('dgram');
const server    = dgram.createSocket('udp4');

console.log(process.cwd());

server.on('error', (err) => {
	log.error(`server error:\n${err.stack}`);
	server.close();
});

server.on('message', (msg, rinfo) => {
	console.log('message', Buffer.from(msg.toString(), 'base64').toString(), rinfo);
});

server.on('listening', () => {
	let address = server.address();
	console.log(`server listening ${address.address}:${address.port}`);
	test();
});

server.bind(4321);

function test() {

	const options = {
		level: 'debug',
		transports: [
			{ type: bandarlog.TRANSPORT.CONSOLE },
			{ type: bandarlog.TRANSPORT.FILE },
			{
				type   : bandarlog.TRANSPORT.UDP,
				host   : '127.0.0.1',
				port   : 4321,
				secret : 'secret key',
				store  : {
					project  : 'test_project',
					hostname : 'test_hostname'
				},
				onResp : data => console.log('onResp', data)
			}
		]
	};

	const log = bandarlog(options, 'winston.log', module);

	log.info('test info');
	log.debug('test debug');
	log.error('test error');
}

