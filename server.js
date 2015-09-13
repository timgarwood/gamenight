var express = require('express');
var sqlite = require('sqlite3');
var session = require('client-sessions');
var bodyParser = require('body-parser');
var app = express();
app.engine('.html', require('ejs').renderFile);

//serve client side web pages statically
app.use(express.static('./static'));
app.use(bodyParser.urlencoded());
app.use(session({
	cookieName: 'session',
	secret: 'game-night-session-secret',
	duration: 30 * 60 * 1000,
	activeDuration: 5 * 60 * 1000,
}));

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
			if(!rows || rows.length == 0) {
				console.log("No user defined for " + username);
				if(cb) {
					cb(null);
				}
			} else if(rows && rows.length > 1) {
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

//inserts a user into the database
var db_insertUser = function(username, password, email, admin, cb) {
	try {
		db.serialize(function() {
			try {
				db.run("insert into users (name,password,email,admin) VALUES (?,?,?,?)", [username,password,email,admin]);
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

var db_deleteUser = function(username, cb) {
	if(!username) {
		cb("null username");
		return;
	}

	db.serialize(function() {
		try {
			db.run("delete from users where name=?", [username]);
		} catch(e) {
			cb(e)
			return;
		}
		cb(null);
	});
}

//returns all users who can be deleted
//(everything but the administrator)
var db_getDeletableUsers = function(cb) {
	db.serialize(function() {
		try {
	    db.all("SELECT * FROM users", function(err, rows) {
	    	if(err) {
	    		console.log("db_getDeletableUsers error: " + err);
	    		cb(null);
	    		return;
	    	}
	  	  cb(rows);
	    });
	  } catch(e) {
	  	console.log("db_getDeletableUsers exception: " + e);
	  	cb(null);
	  }
	});
}

app.post('/login', function(req, resp) {
	if(!req.body.user || !req.body.password) {
		  var err = "login: missing username or password";
  		console.log(err);
  		resp.render('index.html', {error:err});
  		return;
  	}

  	db_getUser(req.body.user, function(user) {
  		if(!user) {
  			var err = "login: user " + req.body.user + " does not exist";
  			console.log(err);
    		resp.render('index.html', {error:err});
  			return;
  		}

  		if(user.password != req.body.password) {
  			var err = "login: user " + req.body.user + " password mismatch";
  			console.log(err);
    		resp.render('index.html', {error:err});
  			return;
  		}

      //store the session information
      //and remove unnecessary info
  		req.session.user = user;
  		delete req.session.user.password;
  		delete req.session.user.email;

  		console.log("rendering welcome.html with " + JSON.stringify(user));
      resp.render("welcome.html", {user : user});
  	});
});

//adds a user to the database
//if it does not already exist.
app.post('/adduser', function(req, resp) {
	if(req.session && req.session.user) {
		console.log("add user requested");
		if(!req.body.name || !req.body.password1 || !req.body.password2 || !req.body.email)
		{
			var err = "missing user information";
			console.log(err);
    	resp.render('usermanagement.html', {error:err});
			return;
		}

		var admin = 0;
		if(req.body.admin != 0) {
			admin = 1;
		}

		db_getUser(req.body.name, function(returnedUser) {
			if(returnedUser) {
				var err = "user " + returnedUser.name + " already exists";
				console.log(err);
				resp.render("usermanagement.html", {error:err});
			  return;
			}

			if(req.body.password1 != req.body.password2) {
				var err = "passwords do not match";
				console.log(err);
				resp.render("usermanagement.html", {error:err});
				return;
			}

			db_insertUser(req.body.name, req.body.password1,
				req.body.email, admin, function(err) {
				var message = "user " + req.body.name + " added successfully!";
				if(err) {
					  message = err;
				}

        resp.render("usermanagement.html", {error:message});
			});
		});
  } else {
  	console.log("adduser: no session or session user detected");
  	resp.redirect('/')
  }
});

//deletes a user from the database if it exists
app.post('/deleteuser', function(req, resp) {
	if(req.session && req.session.user) {
		console.log("delete user - " + JSON.stringify(req.body));
		console.log("delete user - " + req.body.name);
		if(!req.body.name) {
			var err = "must provide a user to delete";
			resp.render("usermanagement.html", {error:err});
			return;
		}

		db_getUser(req.body.name, function(returnedUser) {
			if(!returnedUser) {
	  		var err = req.body.name + " does not exist.";
			  resp.render("usermanagement.html", {error:err});
				return;
			}

			db_deleteUser(req.body.name, function(error) {
				var message = req.body.name + " deleted successfully";
				if(error) {
					message = "error deleting user: " + error;
				}
				console.log(message);
				resp.render("usermanagement.html", {error:message});
			});
		});
  } else {
  	console.log("deleteuser: no session");
  	resp.redirect('/');
  }
});

//replaces the existing data about the user
//with the new data provided.
app.post('/edituser', function(req, resp) {

});

//renders the index page.
app.get('/', function(req, resp) {
	resp.render('index.html', {});
});

//renders the welcome page.
app.get('/welcome', function(req, resp) {
	if(req.session && req.session.user) {
    console.log("get: welcome");
    resp.render('welcome.html', {user:req.session.user});
	} else {
		console.log("get: no session");
		req.redirect('/');
	}
});

//renders the user management page.
app.get('/usermanagement', function(req, resp) {
  if(req.session && req.session.user) {
  	if(req.session.user.admin) {
  		db_getDeletableUsers(function(rows) {
    		resp.render('usermanagement.html', {users: rows});
  		});
  	} else {
  		console.log("get usermanagement user is not an admin");
  		resp.redirect('/welcome');
  	}
  } else {
  	console.log("get usermanagement: no session");
  	resp.redirect('/');
  }
});

app.listen(80);