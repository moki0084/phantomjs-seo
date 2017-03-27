let express = require('express');
let fs = require('fs');
let path = require('path');
let bodyParser = require('body-parser');
let spawn = require('cross-spawn');
let mkdirp = require('mkdirp');

let app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: false
}));

function mkdirs(dirname) {
    return new Promise(function (resolve, reject) {
        mkdirp(dirname, function (err) {
            if (err) {
                reject(err);
            }
            else {
                resolve();
            }
        });
    })
}

function readFile(dirname) {
    return new Promise(function (resolve, reject) {
        fs.readFile(dirname, function (err, data) {
            if (err) {
                reject(err);
            }
            else {
                resolve(data.toString('utf8'));
            }
        })
    })
}

app.get('*', function (req, res) {
    let url = req.protocol + '://' + req.headers.host + req.originalUrl;
    let filePath = path.join(__dirname, 'runtime', req.hostname);
    let fileName = "";
    let originalUrl = req.originalUrl;
    let content = '';
    let phantom;

    if (originalUrl == '/favicon.ico') {
        res.send('');
        return;
    } else {
        let pathArray = originalUrl.split('/');
        fileName = pathArray[pathArray.length - 1] || 'index';
        filePath = path.join(filePath, originalUrl.replace(fileName, ""));
    }
    fileName = encodeURIComponent(fileName);
    //nginx 可处理 文件是否存在直接返回
    readFile(filePath + fileName + '.html').then(function (data) {
        res.send(data);
    }).catch(function () {
        phantom = spawn('phantomjs', ['spider.js', url]);
        phantom.stdout.setEncoding('utf8');
        phantom.stdout.on('data', function (data) {
            content += data.toString();
        });
        phantom.on('exit', function (code) {
            switch (code) {
                case 1:
                    res.send('加载失败');
                    break;
                case 2:
                    // 超时返回的文本,不作写入处理
                    console.error(url + 'timeout');
                    res.send(content);
                    break;
                default:
                    let w_data = content;
                    w_data = Buffer.from(w_data);
                    mkdirs(filePath).then(function () {
                        fs.writeFile(filePath + '/' + fileName + '.html', w_data, {
                            flag: 'w'
                        }, function (err) {
                            if (err) {
                                console.error(err);
                            }
                        });
                        res.send(content);
                    }).catch(function (err) { })
                    break;
            }
        });
    })
});

module.exports = app;