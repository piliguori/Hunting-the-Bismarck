var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var session = require ('express-session');




var port = 8900;


var bodyParser=require('body-parser');

var connection = require('./config'); //lo passo a router momentaneamente

app.use(bodyParser.urlencoded({extended:true}));
app.use(bodyParser.json());

app.use(session({secret:'good luck'}));


app.use(express.static(__dirname + '/app/public'));
require('./app/server/gameServer')(io,connection);
require('./app/server/router')(app,connection,bodyParser);


 http.listen(port, function(){
   console.log('listening on *:' + port);

 });
