var express = require('express');
var sqlite = require('sqlite3');
var bodyParser = require('body-parser');
var app = express();

var db = new sqlite.Database("gamenight.db", sqlite3.OPEN_READWRITE);
if(!db) {
	console.log("could not create gamenight database");
	return;
}

//returns a user if it exists
//null otherwise
var db_getUser = function(username, cb) {
	db.serialize(function() {
		db.prepare("SELECT * FROM users WHERE name=:name");
		db.bind(":name", username);
		var row = db.get();
		cb(row);
	});
}

//inserts a user
var db_insertUser = function(username, password, email, admin, cb) {
	db.serialize(function() {
		var ps = db.prepare("INSERT INTO users VALUES (:name, :password, :email, :admin)");
		ps.bind(":name", username);
		ps.bind(":password", password);
		ps.bind(":email", email);
		ps.bind(":admin", admin);
		ps.run();
		cb(null);
	});
}

//serve client side web pages statically
app.use(express.static('./static'));
app.use(bodyParser.json());

//adds a user to the database
//if it does not already exist.
app.post('/adduser', function(req, resp) {
	console.log("add user requested");
	if(!req.body.user || !req.body.password || !req.body.email)
	{
		console.log("request body missing user");
		resp.status(400).json({error: 'missing user information'});
		return;
	}

	var admin = 0;
	if(req.body.admin != 0) {
		admin = 1;
	}

	db_getUser(req.body.user, function(returnedUser) {
		if(returnedUser) {
			console.log("user already exists");
		    resp.status(400).json({error: 'user already exists'});
		    return;
		}

		db_insertUser(req.body.user, req.body.password,
			req.body.email, req.body.admin, function(err) {
			if(err) {
			    resp.status(500).json({error: err});
				return;
			}

			resp.sendStatus(200);
		});
	});
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