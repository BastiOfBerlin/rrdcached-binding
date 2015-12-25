var RRDUtil = function(){
};

RRDUtil.buildUpdateString = function(updateArray){
	var ret = "";
	for(var update of updateArray){
		ret += update + ":";
	}
	return ret.substring(0, ret.length - 1);
}

module.exports = RRDUtil;