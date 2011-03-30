require.paths.push("./mui/js");

require("http").createServer(function (req,res) {
  res.writeHead(200,{})
  res.end("testing2!")
}).listen(8080)
