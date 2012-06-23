// # Server setup - express

var express = require('express');

var app = express.createServer();

app.configure(function(){
    //app.use(express.methodOverride());
    //app.use(express.bodyParser());
    //app.use(express.cookieParser());
    app.use("/", express.static(__dirname + '/'));
    //app.use(app.router);
});


try {
    app.listen(80);
    console.log("Listening on port 80");
} catch(e) {
    app.listen(8080);
    console.log("Listening on port 8080");
}
