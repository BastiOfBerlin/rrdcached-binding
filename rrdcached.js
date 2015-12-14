'use strict';
var net = require('net');

if(typeof String.prototype.startsWith === 'undefined'){
	String.prototype.startsWith = function(prefix) {
		return this.indexOf(prefix) === 0;
	}
};

var RRDCache = function(){

	var client = null;
	var buffer = '';
	var lastReply = null;

	this.connect = function(address, callback){
		var self = this;
		if(typeof address === 'undefined'){
			address = 'unix:/tmp/rrdcached.sock';
		} else if (address === ''){
			address = ':42217';
		}
		var options = (address.startsWith('unix:/') ? {path: address.substring(5)} : {host: address.substring(0,address.indexOf(':')), port: address.substring(address.indexOf(':') + 1)});
		console.log(options);
		self.client = net.createConnection(options);
		self.client.on('connect', function() {
			this.setEncoding('ascii');
			console.log('on connect');
			callback();
		});
	};

	this.write = function(command, callback){
		var self = this;
		var status = null;
		if(self.client != null && command != null){
			console.log('writing data');
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
				console.log("received: '"+data+"'");
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
					callback(null, self.processData(data));
				}
			});
		} else {
			callback(new Error('Not Connected!'));
		}
	};
	
	this.processData = function(data){
		var lines = data.split('\n');
		var statusIdx = lines[0].indexOf(' ');
		var status = parseInt(lines[0].substring(0, statusIdx));
		var error = status < 0 ? true : false;
		var info = "";
		if(error == false){
			for(var i = 1; i < status; i++){
				info += lines[i] + "\n";
			}
		}
		this.lastReply = {
			statuscode: status,
			status: lines[0].substring(statusIdx + 1),
			error: error,
			info: info
		};
		return this.lastReply;
	};
	
	this.getLastReply = function(){
		return this.lastReply;
	};
};
module.exports = RRDCache;
