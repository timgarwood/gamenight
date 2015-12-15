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
if (!db) {
	console.log("could not create gamenight database");
	return;
}

var userMgr = new (require('./usermgr.js')).UserMgr(db);

app.post('/login', function (req, resp) {
	if (!req.body.user || !req.body.password) {
		var err = "login: missing username or password";
		console.log(err);
		resp.render('index.html', { error: err });
		return;
	}

	userMgr.getUser(req.body.user, function (user) {
		if (!user) {
			var err = "login: user " + req.body.user + " does not exist";
			console.log(err);
			resp.render('index.html', { error: err });
			return;
		}

		if (user.password != req.body.password) {
			var err = "login: user " + req.body.user + " password mismatch";
			console.log(err);
			resp.render('index.html', { error: err });
			return;
		}

		//store the session information
		//and remove unnecessary info
		req.session.user = user;
		delete req.session.user.password;
		delete req.session.user.email;

		console.log("rendering welcome.html with " + JSON.stringify(user));
		resp.render("welcome.html", { user: user });
	});
});

//adds a user to the database
//if it does not already exist.
app.post('/adduser', function (req, resp) {
	if (req.session && req.session.user) {
		console.log("add user requested");
		if (!req.body.name || !req.body.password1 || !req.body.password2 || !req.body.email) {
			var err = "missing user information";
			console.log(err);
			resp.render('usermanagement.html', { error: err });
			return;
		}

		var admin = 0;
		if (req.body.admin != 0) {
			admin = 1;
		}

		userMgr.getUser(req.body.name, function (returnedUser) {
			if (returnedUser) {
				var err = "user " + returnedUser.name + " already exists";
				console.log(err);
				resp.render("usermanagement.html", { error: err });
				return;
			}

			if (req.body.password1 != req.body.password2) {
				var err = "passwords do not match";
				console.log(err);
				resp.render("usermanagement.html", { error: err });
				return;
			}

			var phone = "";
			if (req.body.phone) {
				phone = req.body.phone;
			}

			if (phone != "") {
				var phoneError = function () {
					var err = "invalid phone number";
					console.log(err + " - " + phone);
					resp.render('usermanagement.html', { error: err });
					return;
				}

				var isNumber = function (val) {
					return !isNaN(val) && isFinite(val);
				}

				var chunks = phone.split('-');
				if (chunks.length != 3) {
					phoneError();
					return;
				}

				var area = chunks[0];
				var exg = chunks[1];
				var last4 = chunks[2];

				if (area.length != 3 || exg.length != 3 || last4.length != 4) {
					phoneError();
					return;
				}

				if (!isNumber(area) || !isNumber(exg) || !isNumber(last4)) {
					phoneError();
					return;
				}
			}

			userMgr.addUser(req.body.name, req.body.password1,
				req.body.email, phone, admin, function (err) {
					var message = "user " + req.body.name + " added successfully!";
					if (err) {
						message = err;
					}

					resp.render("usermanagement.html", { error: message });
				});
		});
	} else {
		console.log("adduser: no session or session user detected");
		resp.redirect('/')
	}
});

//deletes a user from the database if it exists
app.post('/deleteuser', function (req, resp) {
	if (req.session && req.session.user) {
		console.log("delete user - " + JSON.stringify(req.body));
		console.log("delete user - " + req.body.name);
		if (!req.body.name) {
			var err = "must provide a user to delete";
			resp.render("usermanagement.html", { error: err });
			return;
		}

		userMgr.getUser(req.body.name, function (returnedUser) {
			if (!returnedUser) {
				var err = req.body.name + " does not exist.";
				resp.render("usermanagement.html", { error: err });
				return;
			}

			userMgr.deleteUser(req.body.name, function (error) {
				var message = req.body.name + " deleted successfully";
				if (error) {
					message = "error deleting user: " + error;
				}
				console.log(message);
				resp.render("usermanagement.html", { error: message });
			});
		});
	} else {
		console.log("deleteuser: no session");
		resp.redirect('/');
	}
});

//replaces the existing data about the user
//with the new data provided.
app.post('/edituser', function (req, resp) {

});

//renders the index page.
app.get('/', function (req, resp) {
	resp.render('index.html', {});
});

//renders the welcome page.
app.get('/welcome', function (req, resp) {
	if (req.session && req.session.user) {
		console.log("get: welcome");
		resp.render('welcome.html', { user: req.session.user });
	} else {
		console.log("get: no session");
		req.redirect('/');
	}
});

//renders the user management page.
app.get('/usermanagement', function (req, resp) {
	if (req.session && req.session.user) {
		if (req.session.user.admin) {
			userMgr.getDeletableUsers(function (rows) {
				resp.render('usermanagement.html', { users: rows });
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