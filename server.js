require("http").createServer(function (req,res) {
  res.writeHead(200,{})
  res.end("testing!")
}).listen(80)
