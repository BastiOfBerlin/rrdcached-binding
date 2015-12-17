# rrdcached-binding
This is a Node.js lib for binding to RRDrool's [rrdcached](https://oss.oetiker.ch/rrdtool/doc/rrdcached.en.html) using node's net API.

# Usage
You can connect to both UNIX and TCP sockets. Sockets should have a unix: prefix followed by a path. For TCP connections, an IP address and port must be supplied.

Most commands the daemon understands are encapsulated as own functions. Nevertheless, any command can be sent as a string. You'll get an Object back as a result:
```
{ statuscode: 4,
  status: 'Help for FLUSHALL',
  error: false,
  info:
   [ 'Usage: FLUSHALL',
     '',
     'Triggers writing of all pending updates.  Returns immediately.' ] }
```
The most important attributes will be `error`, which indicates if the command completed normally, and the `info` array, which contains the actual result of the command.
See [PROTOCOL section](https://oss.oetiker.ch/rrdtool/doc/rrdcached.en.html#IPROTOCOL) for details about statuscode etc. and [Valid Commands](https://oss.oetiker.ch/rrdtool/doc/rrdcached.en.html#IValid_Commands) for a list of commands.

## Installation
```
npm install rrdcached-binding
```

## Connecting
``` js
RRD = require('./rrdcached');
RRD.connect('unix:/tmp/rrdcached.sock', function(err){
	console.log('connected');
});
```

OR

``` js
RRD = require('./rrdcached');
RRD.connect('192.168.0.200:42217', function(err){
	console.log('connected');
});
```

## Commands
Supported commands are:
- `RRD.update(filename, values, callback)`
  - `values` can be a single String or an Array of String
- `RRD.flush(filename, callback)`
- `RRD.flushall(callback)`
- `RRD.help(command, callback)`
- `RRD.pending(filename, callback)`
- `RRD.forget(filename, callback)`
- `RRD.queue(callback)`
  - In addition to the `info`-array, there is a parsed `queue` Object with `file` -\> number of values to be written for the `file`
- `RRD.stats(callback)`
  - In addition to the `info`-array, there is a parsed assiciative `stats` Object with the different stats
- `RRD.ping(callback)`
- `RRD.first(filename, rranum, callback)`
  - `rranum` is optional
- `RRD.last(filename, callback)`
- `RRD.info(filename, callback)`
- `RRD.create(filename, options, DSDefinitions, RRADefinitions, callback)`
- `RRD.batch(commands, callback)`
  - commands is currently an Array of String consisting of custom commands (see below)
- `RRD.quit(callback)`

Note that `callback` is of the form `function(err, reply)`!

## Sending custom commands
``` js
RRD.write('HELP FLUSHALL', function(err, reply){
	if(err){
		console.log("Error: " + err);
		return;
	}
	console.log(reply);
	console.log('exiting');
	process.exit(0);
});
```

# TODO
- [ ] FETCH command
- [ ] FETCHBIN command

# Known issues
