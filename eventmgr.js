var sqlite = require('sqlite3');

var EventMgr = function(db) {
	var self = this;
	self.db = db;
}

EventMgr.prototype = function() {
	var self = this;
	var addEvent = function(eventName, eventDate, cb) {
		try {
			self.db.serialize(function() {
				try {
					self.db.run("insert into events (name, date) VALUES (?,?)", [eventName, eventDate]);
					if(cb) {
						cb(null);
					}
				} catch(e) {
					cb({error: "exception occurred" + e});
				}
			});
		} catch(e) {
			cb({error: "exception occurred" + e});
		}
	}
	
	var deleteEvent = function(eventName, cb) {
		try {
			self.db.serialize(function() {
				try {
					self.db.run("delete from events where name=?", [eventName]);
					removeSignUps(eventName, function(error) {
						if (cb) {
							cb(error);
						}
					});
				} catch(e) {
					if(cb) {
						cb({error: "exception occurred: " + e});
					}
				}
			});
		} catch(e) {
			if (cb) {
				cb({ error: "exception occurred: " + e });
			}
		}
	}
	
	var addSignUp = function(userName, eventName, cb) {
		try {
			self.db.serialize(function () {
				try {
					self.db.run("insert into signup (username,eventname) VALUES (?,?)", [userName, eventName]);
					if(cb) {
						cb(null);
					}
				} catch(e) {
					if(cb) {
						cb({error : "exception occurred: " + e});
					}
				}
			});
		} catch(e) {
			if (cb) {
				cb({ error: "exception occurred: " + e });
			}
		}
	}
	
	var removeSignUp = function(userName, eventName, cb) {
		try {
			self.db.serialize(function() {
				try {
					this.db.run("delete from signup where username=? and eventname=?", [userName, eventName]);
					if(cb) {
						cb(null);
					}					
				} catch(e) {
					if (cb) {
						cb({ error: "exception occurred: " + e });
					}					
				}
				
			});
		} catch(e) {
			if (cb) {
				cb({ error: "exception occurred: " + e });
			}			
		}
	}
	
	var removeSignUps = function(eventName, cb) {
		try {
			self.db.serialize(function() {
				try {
					self.db.run("delete from signup where eventname=?", [eventName]);
					if(cb) {
						cb(null);
					}
				} catch(e) {
					if(cb) {
						cb({error: "exception occurred: " + e});
					}	
				}
			});
		} catch(e) {
			if (cb) {
				cb({ error: "exception occurred: " + e });
			}			
		}
	}
	
	return {
		addEvent : addEvent,
		removeEvent : removeEvent,
		addSignUp : addSignup,
		removeSignUp : removeSignup,
		removeSignUps : removeSignUps
	};
	
}();

exports.EventMgr = EventMgr;