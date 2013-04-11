/*!
 * TPL
 * Copyright(c) 2013 lepharye@gmail.com
 * MIT Licensed
 */

 var path = require("path")
 	, basename = path.basename
	, dirname = path.dirname
	, extname = path.extname
	, join = path.join
	, fs = require("fs");

var modifier = require("./modifier")
	, functions = require("./functions")
	, merge = require("./merge_file");

var cache = {};
//清理缓存
exports.clearCache = function(){
	cache = {};
};
/**
 * 智能字符串分割(String.prototype.split)
 * @param {String} str 目标字符串
 * @param {String} ch  分割字符
 */
function string_split(str, ch){
	var ret = [], cache = [];
	for(var i=0, len=str.length; i<len; i++){
		var s = str.substr(i, 1);

		if(s == "'" || s == "\""){
			var end = str.indexOf(s, i+1);
			if(end == -1){
				end = len;
			}
			cache.push(str.substring(i, end + 1));
			i = end;
			continue;
		}

		if(s == ch){
			ret.push(cache.join(""));
			cache = [];
		}else{
			cache.push(s);
		}
	}
	if(cache.length > 0){
		ret.push(cache.join(""));
	}
	return ret;
}
/**
 * 字符串解析
 * @param {String} str
 * @param {Object} options
 * @param {Array} buf
 */
function buildParse(str, options, buf){

	var options = options || {}
		, open = options.open || exports.open || "<%"
		, close = options.close || exports.close || "%>"
		, filename = options.filename;

	var functionRegExp = /^[A-Za-z]+\b(?:\s*(\w+)=['"](.+?)['"])/;

	buf.push('\nbuf.push(\'');

	for(var i=0, len = str.length; i<len; i++){
		if(str.slice(i, open.length+i) == open){
			i+= open.length;
			var prefix, postfix;
			var isValue = false;
			switch(str.substr(i, 1)){
				case "=": //赋值
					prefix = '\',';
					postfix = ',\'';
					i++;
					isValue = true;
					break;
				case "*": //对注释的处理
					var end = str.indexOf("*" + close, i);
					i = end + 1 + close.length;
					continue;
				default: //表达式
					prefix = '\');';
					postfix = '; buf.push(\'';
			}
			var end = str.indexOf(close, i)
				, js = str.substring(i, end)
				, start = i;

			if(js){
				if(isValue){
					var arr = js.split("|");
					var val = arr[0];
					//var realValue = val;
					//modifier
					if(typeof arr[1] != "undefined"){
						var arr2 = string_split(arr[1], ":");
						var mod = modifier[arr2[0]];
						if(typeof mod == "function"){
							//realValue = mod.call(this, val, arr2.splice(1));
							//使用闭包方式，实现变量调节器
							buf.push("');buf.push((");
							buf.push(mod.call(this).toString());
							var args = arr2.splice(1);
							if(args.length > 0){
								buf.push(")(" + val + " || ''," + args.join(",") + "));");
							}else{
								buf.push(")(" + val + " || ''));");
							}
							buf.push("buf.push('");
						}else{
							throw new Error("modifier:" + arr2[0] + " is not defined");
						}
					}else{
						buf.push(prefix, val, postfix);
					}
				}else{
					if(functionRegExp.test(js)){
						//custom functions
						var fnName = js.substring(0, js.indexOf(" "));
						if(fnName == "include"){
							//这种情况不会再出现了，meger中已经处理了
							/*
							var file = js.match(/file=('|")(.+?)\1/)[2];
							var inc_file = path.join(path.dirname(filename), file);
							var opts = {};
							//options clone
							for(var name in options){
								opts[name] = options[name];
							}
							opts.filename = inc_file;
							buf.push("');");
							buildParse(getFileString(inc_file, options), opts, buf);
							buf.push("buf.push('");
							*/
						}else{
							var objs = {};
							var fun = functions[fnName];
							if("function" == typeof fun){
								//使用闭包方式，实现自定义函数
								buf.push("');buf.push((");
								buf.push(fun.call(this, options).toString());
								var args = js.substr(js.indexOf(" "));
								args = args.replace(/(\w+)=('|")(.+?)\2/g,function(){
									return RegExp.$1 + ":'" + RegExp.$3 + "',";
								});
								args = args.replace(/(\w+)=([^\s]+)/g,function(){
									return RegExp.$1 + ":" + RegExp.$2 + ",";
								});

								buf.push(")({" + args + "}));");
								buf.push("buf.push('");
							}else{
								throw new Error("function:[" + fnName + "] is not defined");
							}
						}
					}else{
						buf.push(prefix, js, postfix);
					}
				}
			}

			i += end - start + close.length - 1;
		}else if(str.substr(i, 1) == "\\"){
			buf.push("\\\\");
		}else if(str.substr(i, 1) == "'"){
			buf.push("\\'");
		}else if(str.substr(i, 1) == "\r"){
			buf.push(" ");
		}else if(str.substr(i, 1) == "\n"){
			buf.push("\\n");
		}else{
			buf.push(str.substr(i, 1));
		}
	}
	buf.push('\');');

}

var parse = exports.parse = function(str, options){
	var options = options || {};

	var buf = [];
	buf.push('var buf=[];');
	buf.push('with(locals || {}){');
	
	buildParse(str, options, buf);

	buf.push('};return buf.join("");');
	return buf.join("");
};
/**
 * 编译
 */
var compile = exports.compile = function(str, options){
	options = options || {};
	var tpl =  parse(str, options);
	var fn = new Function("locals", tpl);
	return function(locals){
		return fn.call(this, locals); 
	}; 
};
/**
 * 编译、执行
 * @param {String} str
 * @param {Object} options
 * @return {String}
 */
exports.render = function(str, options){
	var fn, options = options || {};

	if(options.cache){
		if(options.filename){
			fn = cache[options.filename] || (cache[options.filename] = compile(str, options));
		}
	}else{
		fn = compile(str, options);
	}
	options.__proto__ = options.locals;
	return fn.call(options.scope, options);
};

/**
 * 读取文件内容
 * @return {String}
 */
function getFileString(path, options){
	var key = path + "__tpl__";
	var str = options.cache
		? cache[key] || (cache["key"] = merge(fs.readFileSync(path, "utf8"), options))
		: merge(fs.readFileSync(path, "utf8"), options);
	return str;
}
exports.getFileString = getFileString;
/**
 * Express 调用接口
 * @param path
 * @param options
 * @param fn
 * @return
 */
exports.renderFile = function(path, options, fn){
	if("function" == typeof options){
		fn = options, options = {};
	}

	options.filename = path;
	options.open = exports.open || "<%";
	options.close = exports.close || "%>";

	try{
		var str = getFileString(path, options);
		fn(null, exports.render(str, options));
	}catch(err){
		fn(err);
	}
};

//express support
exports.__express = exports.renderFile;


