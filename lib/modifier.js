/**
 * tpl engine modifiers
 * @author lifayu
 * @since 2013-04-05
 */
/**
 * 字符串编码
 */
 exports.escape = function(){
	return function(value, type){
		switch(type){
			case "javascript":
			case "js":
				return value.replace(/(['"\/\\])/g, "\\$1");
				break;
			case "htmljs":
				return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/(['"\/\\])/g, "\\$1");
				break;
			case "jshtml":
				return value.replace(/(['"\/\\])/g, "\\$1").replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, "&quot;").replace(/'/g, "&#39;");
				break;
			case "url":
				return encodeURIComponent(value);
				break;
			case "quotes":
				return value.replace(/"/g, "&#34;").replace(/'/g, "&#39;");
				break;
			case "html":
			default:
				return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, "&quot;").replace(/'/g, "&#39;");
		}
	};
 }

/**
 * 设置默认值
 */
 exports.dft = function(){
 	return function(value, dft){
		return value || dft;
	}
 }

/**
 * 字母转换为小写 
 */
 exports.lower = function(){
 	return function(value){
		return value.toLowerCase();
	}
 }
/**
 * 字母转换为大写
 */
 exports.upper = function(){
 	return function(value){
		return value.toUpperCase();
	}
 }
/**
 * 将\n转换为br
 */
 exports.nl2br = function(){
 	return function(value){
		return value.replace(/\n/g, "<br/>");
	}
 }
/**
 * 插入软换行
 */
 exports.wbr = function(){
 	return function(value){
		return value.replace(/(?:<[^>]+>)|(?:&#?[0-9a-z]{2,6};)|(.{1})/gi, '$&<wbr>').replace(/><wbr>/g, '>');
	}
 }
/**
 * 字符串替换
 */
 exports.replace = function(){
 	return function(value, src, dist){
		return value.replace(src, dist);
	}
 }
/**
 * 字符串正则替换
 */
 exports.regex_replace = function(){
 	return function(value, regex, dist){
		return value.replace(new RegExp(regex), dist);
	}
 }
/**
 * 过滤空白字符
 */
 exports.strip = function(){
 	return function(value){
		var trimer = new RegExp("(^[\\s\\t\\xa0\\u3000]+)|([\\u3000\\xa0\\s\\t]+\x24)", "g");
		return value.replace(trimer, "");
	}
 }
/**
 * 过滤html标签
 */
 exports.strip_tag = function(){
 	return function(value){
		return value.replace(/<[^>]+>/g, '');
	}
 }
/**
 * 字符串截取
 */
 exports.truncate = function(){
 	return function(value, length, tail){
		/**
		 * 获取字符串长度
		 */
		function getByteLength(source) {
			return String(source).replace(/[^\x00-\xff]/g, "ci").length;
		}
		tail = tail || "";
		if(length < 0 || getByteLength(value) <= length) {
			return value;
		}
		value = value.substr(0, length).replace(/([^\x00-\xff])/g, "\x241 ")//双字节字符替换成两个
						.substr(0, length)//截取长度
						.replace(/[^\x00-\xff]$/, "")//去掉临界双字节字符
						.replace(/([^\x00-\xff]) /g, "\x241"); //还原
		return value + tail;
	}
 }
/**
 * 日期格式化
 */
 exports.date_format = function(){
 	return function(value, pattern){
		var date = new Date(Date.parse(value));
		var o = {
			"M+" : date.getMonth() + 1,
			"d+" : date.getDate(),
			"H+" : date.getHours(),
			"m+" : date.getMinutes(),
			"s+" : date.getSeconds()
		};
		pattern = pattern.replace(/(y+)/, function() {
			return String(date.getFullYear()).substr(4 - arguments[0].length);
		});
		for(var i in o) {
			pattern = pattern.replace(new RegExp("(" + i + ")"), function() {
				return ("00" + o[i]).substr(String(o[i]).length);
			});
		}
		return pattern;
	}
 }
