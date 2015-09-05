console.log("1");
var express = require('express');
var sqlite = require('sqlite3');
var app = express();

//server client side web pages statically
app.use(express.static('./static'));

app.post('/adduser', function(req, resp) {
	console.log("add user requested");
});

app.post('/deleteuser', function(req, resp) {

});

app.post('/edituser', function(req, resp) {

});

app.get('/getuser', function(req, resp) {
});

app.get('/getusers', function(req, resp) {

});

app.listen(80);