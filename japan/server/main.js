// 取得路徑的值
// let url = req.url.slice(0, req.url.indexOf('?'));
var http = require('http');
var querystring = require('querystring');
var util = require('util');
 
http.createServer(function(req, res){
    // 定義了一個post變量，用於暫存請求體的信息
    var post = '';     
 
    // 通過req的data事件監聽函數，每當接受到請求體的數據，就累加到post變量中
    req.on('data', function(chunk){    
        post += chunk;
    });
 
    // 在end事件觸發後，通過querystring.parse將post解析為真正的POST請求格式，然後向客戶端返回。
    req.on('end', function(){    
        post = querystring.parse(post);
        // post = util.inspect(post);
        res.end(util.inspect(post));
        console.log("debug : ");
        console.log(post.a);

        // console.log("debug a : ");
        // console.log(post.a);
        
        // // 設定 HTTP 標頭
        // res.writeHead(200, { 'Content-Type': 'text/plain' });
  
        // // 取得 a 參數的值
        // const a = util.inspect(post);
        // console.log("debug a : " + a);

        // // 根據 a 的值回傳不同的回應
        // if (req.url === '/') {
        //     res.end('Hello, World!\n');
        // } else if (req.url === '/test' && a === '0') {
        //     res.statusCode = 404;
        //     res.end('404 Not Found\n');
        // } else if (req.url === '/test' && a === '1') {
        //     res.statusCode = 500;
        //     res.end('Error\n');
        // } else if (req.url === '/test' && a === '2') {
        //     res.statusCode = 200;
        //     res.end('OK\n');
        // } else {
        //     res.statusCode = 404;
        //     res.end('Not Found\n');
        // }
    });
}).listen(3000, 'localhost', () => {
    console.log('Server running at http://localhost:3000/');
});
