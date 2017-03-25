let express = require('express');
let fs = require('fs');
let path = require('path');
let bodyParser = require('body-parser');
let spawn = require('cross-spawn')

let app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: false
}));

let mkdirsSync = function mkdirsSync(dirname) {
    if (!fs.existsSync(dirname)) {
        if (mkdirsSync(path.dirname(dirname))) {
            fs.mkdirSync(dirname);
        }
    }
    return true;
};

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
    try {
        let rData = fs.readFileSync(filePath + fileName + '.html');
        res.send(rData.toString('utf8'));
    } catch (e) {
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
                    mkdirsSync(filePath);
                    fs.writeFile(filePath + '/' + fileName + '.html', w_data, {
                        flag: 'w'
                    }, function (err) {
                        if (err) {
                            console.error(err);
                        }
                    });
                    res.send(content);
                    break;
            }
        });
    }
});

module.exports = app;