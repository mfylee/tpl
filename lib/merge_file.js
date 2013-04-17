/**!
 * 文件继承合并
 * extend，include
 * @author mfylee@163.com
 * @since 2013-04-08
 * @version 0.0.1
 */
var path = require("path"), fs = require("fs");

var line_break = "___line___break___";

function escapeString(str) {
    str = str.replace(/\t/g, "    ");
    str = str.replace(/\n/g, line_break);
    return str;
}

function cloneObject(obj, opts) {
    var ret = {};
    for(var i in obj) {
        ret[i] = obj[i];
    }
    for(var i in opts) {
        ret[i] = opts[i];
    }
    return ret;
}

function merge_extend(tpl, options) {
    var pstr = "";
    var extendRegExp = new RegExp(options.open + "extend\\s*file=('|\")(.+?)\\1" + options.close);
    if(extendRegExp.test(tpl)) {
        var parentFile = tpl.match(extendRegExp)[2];
        var file = path.join(path.dirname(options.filename), parentFile);
        pstr = fs.readFileSync(file, "utf8");

        pstr = merge_include(pstr, cloneObject(options, {
            filename : file
        }));

        pstr = escapeString(pstr);
        tpl = escapeString(tpl);

        var blockRegExp = new RegExp(options.open + "block\\s*name=('|\")(\\w+)\\1\\s*" + options.close + "(.+?)" + options.open + "\\/block" + options.close, "g");
        pstr = pstr.replace(blockRegExp, function(str, quot, name, content) {
            var reg = new RegExp(options.open + "block\\s*name=('|\")" + name + "\\1\\s*" + options.close + "(.+?)" + options.open + "\\/block" + options.close, "i");
            var arr = tpl.match(reg);
            if(arr != null) {
                return arr[2];
            } else {
                return content;
            }
        });
    } else {
        pstr = tpl;
    }
    return pstr;
}

function merge_include(tpl, options) {
    var regexp = new RegExp(options.open + "include\\s*file=('|\")(.+?)\\1" + options.close, "g");
    tpl = tpl.replace(regexp, function() {
        var filename = arguments[2];
        var file = path.join(path.dirname(options.filename), filename);
        var str = fs.readFileSync(file, "utf8");
        var opts = {};
        for(var name in options) {
            opts[name] = options[name];
        }
        opts.filename = file;
        return merge(str, opts);
    });
    return tpl;
}

function merge(tpl, options) {
    //1. include handler
    tpl = merge_include(tpl, options);
    //2. extend handler
    tpl = merge_extend(tpl, options);
    tpl = tpl.replace(new RegExp(line_break, "g"), "\n");
    return tpl;
}

module.exports = merge;

function test() {
    var file = path.join(__dirname, "test/index.html");
    var str = fs.readFileSync(file, "utf8");
    //var ret = merge_extend(str);
    var ret = merge(str, {
        filename : file,
        open : "{{",
        close : "}}"
    });
    console.log(ret);
}

//test();
