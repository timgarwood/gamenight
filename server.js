var express = require('express');
var sqlite = require('sqlite3');
var bodyParser = require('body-parser');
var app = express();
app.engine('.html', require('ejs').renderFile);

var db = new sqlite.Database("gamenight.db", sqlite.OPEN_READWRITE);
if(!db) {
	console.log("could not create gamenight database");
	return;
}

//returns a user if it exists
//null otherwise
var db_getUser = function(username, cb) {
	db.serialize(function() {
		db.all("SELECT * FROM users WHERE name=?", [username], function(err, rows) {
			if(rows.length == 0) {
				console.log("No user defined for " + username);
				if(cb) {
					cb(null);
				}
			} else if(rows.length > 1) {
				console.log("Multiple users with name " + username);
				if(cb) {
					cb(null);
				}
			} else {
				if(cb) {
					cb(rows[0]);
				}
			}
		});
	});
}

//inserts a user
var db_insertUser = function(username, password, email, admin, cb) {
	try {
		db.serialize(function() {
			try {
				db.run("insert into users (name,password,email,admin) VALUES (?,?,?,?)", [usernmae,password,email,admin]);
				if(cb) {
					cb(null);
				}
			} catch(e) {
				cb({error:"exception occurred" + e});
			}
		});
	}catch(e) {
		cb({error:"exception occurred " + e});
	}
}

//serve client side web pages statically
app.use(express.static('./static'));
app.use(bodyParser.urlencoded());

app.post('/login', function(req, resp) {
	if(!req.body.user || !req.body.password) {
  		console.log("login: missing username or password");
  	 	resp.status(400).json({error : 'login: missing username or password'});
  		return;
  	}

  	db_getUser(req.body.user, function(user) {
  		if(!user) {
  			var err = "login: user " + req.body.user + " does not exist";
  			console.log(err);
  			resp.status(400).json({error:err});
  			return;
  		}

  		if(user.password != req.body.password) {
  			var err = "login: user " + req.body.user + " password mismatch";
  			console.log(err);
  			resp.status(400).json({error:err});
  			return;
  		}

        resp.render("welcome.html", user);
  	});

});

//adds a user to the database
//if it does not already exist.
app.post('/adduser', function(req, resp) {
	console.log("add user requested");
	if(!req.body.user || !req.body.password1 || !req.body.password2 || !req.body.email)
	{
		console.log("request body missing user information");
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

		if(req.body.password1 != req.body.password2) {
			console.log("adduser: passwords don't match");
			resp.status(400).json({error: 'passwords do not match'});
			return;
		}

		db_insertUser(req.body.user, req.body.password1,
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