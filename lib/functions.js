
/**
 * Custom Function DEMO
 */
exports.method = function(opts){
	//console.log("[method]");
	//console.log(opts);
	return function(args){
		return JSON.stringify(args);
	}
}
