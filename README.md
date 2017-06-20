# bandar-log

```npm i bandar-log```

```
const bandarlog = require('bandar-log');

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
```
