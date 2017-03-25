/**
 * 网页爬虫生成网页
 * 第二个参数为url
 */
"use strict";
var page = require('webpage').create();
var system = require('system');

var resourceWait = 500;
var resourceWaitTimer;
var maxWait = 5000;
var maxWaitTimer;
var resourceCount = 0;
var win = {
    pc: {
        size: {
            width: 1900,
            height: 960
        },
        ua: 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/53.0.2785.143 Safari/537.36'
    },
    m: {
        size: {
            width: 414,
            height: 672
        },
        ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 9_1 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Version/9.0 Mobile/13B143 Safari/601.1'
    }
}
var curSite = 'pc';

phantom.onError = function (msg, trace) {
    // var msgStack = ['PHANTOM ERROR: ' + msg];
    // if (trace && trace.length) {
    //     msgStack.push('TRACE:');
    //     trace.forEach(function (t) {
    //         msgStack.push(' -> ' + (t.file || t.sourceURL) + ': ' + t.line + (t.function ? ' (in function ' + t.function+')' : ''));
    //     });
    // }
    // console.error(msgStack.join('\n'));
    phantom.exit(1);
};

var url = system.args[1];
if (!/^((http(s?))\:\/\/)[a-zA-Z0-9\-\.]+\.[a-zA-Z]+(\:[0-9]+)*(\/($|[a-zA-Z0-9\.\,\;\?\'\\\+&%\$#\=~_\-]+))*$/.test(url)) {
    phantom.exit(1);
}

// Mobile or PC setting
if (/(\/m.)/.test(url)) {
    curSite = 'm'
}
page.settings.userAgent = win[curSite].ua;
page.viewportSize = win[curSite].size;

function capture(errCode) {
    console.log(page.content);
    clearTimeout(maxWaitTimer);
    phantom.exit(errCode);
};

// Resource
page.onResourceRequested = function (req) {
    resourceCount++;
    clearTimeout(resourceWaitTimer);
};

page.onResourceReceived = function (res) {
    if (res.stage === 'end') {
        resourceCount--;
        if (resourceCount === 0) {
            resourceWaitTimer = setTimeout(capture, resourceWait);
        }
    }
};

page.onResourceTimeout = function (req) {
    resouceCount--;
};

page.onResourceError = function (err) {
    resourceCount--;
};

page.open(url, function (status) {
    if (status !== 'success') {
        phantom.exit(1);
    } else {
        maxWaitTimer = setTimeout(function () {
            capture(2);
        }, maxWait);
    }
});