## phantomjs-seo

spa、ajax等，国内搜索引擎无法抓取，通过seo服务器来返回对应的静态页，让搜索引擎进行收录。

nginx匹配搜索引擎UA反向代理到当前seo服务器，seo服务器通过phantomjs爬虫生成对应的页面返回显示。

phantomjs爬对应url，超时响应为5秒，超时url需记录到日志。

run

    npm run start


生成静态页路径 runtime/domain/path/[name].html

