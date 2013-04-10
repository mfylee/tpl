/**
 * tpl engine modifiers
 * @author lifayu
 * @since 2013-04-05
 */

 exports.escape = function(){
	return function(value, type, other){
		return value + " HTML: " + other;
	};
 }
