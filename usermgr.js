var sqlite = require('sqlite3');

function UserMgr(db) {
	this.db = db;
}

UserMgr.prototype = {
	//inserts a user into the database
	addUser : function(username, password, email, phone, admin, cb) {
		try {
			this.db.serialize(function() {
				try {
					this.db.run("insert into users (name,password,email,phone,admin) VALUES (?,?,?,?,?)", [username,password,email,phone,admin]);
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
	},
	deleteUser : function(username, cb) {
		if(!username) {
			cb("null username");
			return;
		}

		this.db.serialize(function() {
			try {
				this.db.run("delete from users where name=?", [username]);
			} catch(e) {
				cb(e)
				return;
			}
			cb(null);
		});
	},
  //returns a user if it exists
  //null otherwise
	getUser : function(username, cb) {
		this.db.serialize(function() {
			this.db.all("SELECT * FROM users WHERE name=?", [username], function(err, rows) {
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
	},
  //returns all users who can be deleted
  //(everything but the administrator)
	getDeletableUsers : function(cb) {
		this.db.serialize(function() {
			try {
				this.db.all("SELECT * FROM users", function(err, rows) {
					if(err) {
						console.log("getDeletableUsers error: " + err);
						cb(null);
						return;
					}
					cb(rows);
				});
			} catch(e) {
				console.log("getDeletableUsers exception: " + e);
				cb(null);
			}
		});
	}
}