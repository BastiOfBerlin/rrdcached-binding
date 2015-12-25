'use strict';
var net = require('net');

if(typeof String.prototype.startsWith === 'undefined'){
	String.prototype.startsWith = function(prefix) {
		return this.indexOf(prefix) === 0;
	}
};

var escapeRegExp = function(str) {
    return str.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
}

var RRDCache = function(){
	var client = null;
	var buffer = '';
	var lastReply = null;
};

RRDCache.connect = function(address, callback){
	var self = this;
	if(typeof address === 'undefined'){
		address = 'unix:/tmp/rrdcached.sock';
	} else if (address === ''){
		address = ':42217';
	}
	var options = (address.startsWith('unix:/') ? {path: address.substring(5)} : {host: address.substring(0,address.indexOf(':')), port: address.substring(address.indexOf(':') + 1)});
	self.client = net.createConnection(options);
	self.client.on('connect', function() {
		this.setEncoding('ascii');
		callback();
	});
};

RRDCache.write = function(command, callback){
	var self = this;
	var status = null;
	if(self.client != null && command != null){
		command = command.trim();
		// append newline to terminate command
		if(command.substring(command.length - 1) != "\n"){
			command += "\n";
		}
		if(command === 'QUIT\n'){
			self.client.end(command, 'ascii');
		} else {
			self.client.write(command, 'ascii');
		}
		self.client.on('data', function(data){
			if(!self.buffer){
				self.buffer = "";
			}
			self.buffer += data;
			if(status == null){
				status = parseInt(self.buffer.substring(0, self.buffer.indexOf(' ')));
			}
			var receivedAll = status < 0 || ((self.buffer.match(/\n/g) || []).length == status + 1);
			if(receivedAll){
				self.buffer = "";
				status = null;
				callback(null, processData(data));
			}
		});
	} else {
		callback(new Error('Not Connected!'));
	}
};

var processData = function(data){
	var lines = data.split('\n');
	var statusIdx = lines[0].indexOf(' ');
	var status = parseInt(lines[0].substring(0, statusIdx));
	var error = status < 0 ? true : false;
	var info = Array();
	if(error == false){
		for(var i = 1; i < status; i++){
			info.push(lines[i]);
		}
	}
	RRDCache.lastReply = {
		statuscode: status,
		status: lines[0].substring(statusIdx + 1),
		error: error,
		info: info
	};
	return RRDCache.lastReply;
};

var replaceN = function(value){
	return value.replace(new RegExp(escapeRegExp('N'), 'g'), parseInt(Date.now()/1000));
}

RRDCache.flush = function(filename, callback){
	RRDCache.write(util.format("FLUSH %s", filename), callback);
};

RRDCache.flushall = function(callback){
	RRDCache.write("FLUSHALL", callback);
};

RRDCache.help = function(command, callback){
	RRDCache.write(util.format("HELP %s", command), callback);
};

RRDCache.pending = function(filename, callback){
	RRDCache.write(util.format("PENDING %s", filename), callback);
};

RRDCache.forget = function(filename, callback){
	RRDCache.write(util.format("FORGET %s", filename), callback);
};

RRDCache.queue = function(callback){
	RRDCache.write("QUEUE", function(err, reply){
		if(err){
			callback(err);
		}
		reply.queue = {};
		for(var line of reply.info){
			var split = line.split(" ");
			reply.queue[split[1]] = parseInt(split[0]);
		}
		callback(null, reply);
	});
};

RRDCache.stats = function(callback){
	RRDCache.write("STATS", function(err, reply){
		if(err){
			callback(err);
		}
		reply.stats = {};
		for(var line of reply.info){
			var split = line.split(": ");
			reply.stats[split[0]] = parseInt(split[1]);
		}
		callback(null, reply);
	});
};

RRDCache.ping = function(callback){
	RRDCache.write("PING", callback);
};

RRDCache.update = function(filename, values, callback){
	var newValues = "";
	if(Array.isArray(values)){
		for(var v of values){
			newValues += v + " ";
		}
	} else {
		newValues = values;
	}
	RRDCache.write(util.format("UPDATE %s %s", filename, replaceN(newValues)), callback);
};

RRDCache.first = function(){
	if(arguments.length >= 2 && arguments.length <=3){
		var filename = arguments[0];
		var rranum = arguments.length == 3 ? arguments[1] : 0;
		var callback = arguments.length == 3 ? arguments[2]: arguments[1];
		RRDCache.write(util.format("FIRST %s %d", filename, rranum), callback);
	}
};

RRDCache.last = function(filename, callback){
	RRDCache.write(util.format("LAST %s", filename), callback);
};

RRDCache.info = function(filename, callback){
	RRDCache.write(util.format("INFO %s", filename), callback);
};

RRDCache.create = function(filename, options, DSDefinitions, RRADefinitions, callback){
	var stepsize = options.stepsize !== undefined ? util.format("-s %d", options.stepsize) : "";
	var begintime = options.begintime !== undefined ? util.format("-b %d", options.begintime) : "";
	var o = options.o !== undefined && options.o ? "-O" : "";
	RRDCache.write(util.format("CREATE %s %s %s %s %s %s", filename, stepsize, begintime, o, DSDefinitions, RRADefinitions), callback);
};

RRDCache.batch = function(commands, callback){
	if(Array.isArray(commands)){
		var command = "BATCH\n";
		for(var c of commands){
			command += c + "\n";
		}
		command += ".";
		RRDCache.write(command, callback);
	}
};

RRDCache.quit = function(callback){
	RRDCache.write("QUIT", callback);
};

RRDCache.getLastReply = function(){
	return this.lastReply;
};

module.exports = RRDCache;
