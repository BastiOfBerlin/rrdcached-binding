# rrdcached-binding
This is a Node.js lib for binding to RRDrool's [rrdcached](https://oss.oetiker.ch/rrdtool/doc/rrdcached.en.html) using node's net API.

# Usage
You can connect to both UNIX and TCP sockets. Sockets should have a unix: prefix followed by a path. For TCP connections, an IP address and port must be supplied.

Any command can be sent as a string. You'll get an Object back as a result:
```
{ statuscode: 4,
  status: 'Help for FLUSHALL',
  error: false,
  info:
   [ 'Usage: FLUSHALL',
     '',
     'Triggers writing of all pending updates.  Returns immediately.' ] }
```
The most important attributes will be error, which indicates if the command completed normally, and the info array, which contains the actual result of the command.
See [PROTOCOL section](https://oss.oetiker.ch/rrdtool/doc/rrdcached.en.html#IPROTOCOL) for details about statuscode etc. and [Valid Commands](https://oss.oetiker.ch/rrdtool/doc/rrdcached.en.html#IValid_Commands) for a list of commands.

## Connecting
``` js
RRD = require('./rrdcached');
rrd = new RRD();
rrd.connect('unix:/tmp/rrdcached.sock', function(err){
	console.log('connected');
});
```

OR

``` js
RRD = require('./rrdcached');
rrd = new RRD();
rrd.connect('192.168.0.200:42217', function(err){
	console.log('connected');
});
```

## Sending commands
``` js
rrd.write('HELP FLUSHALL', function(err, reply){
	if(err){
		console.log("Error: " + err);
		return;
	}
	console.log(reply);
	console.log('exiting');
	process.exit(0);
});
```

# Known issues
