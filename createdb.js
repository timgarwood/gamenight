var sqlite3 = require('sqlite3').verbose();
var fs = require('fs');
var input = require('readline').createInterface({input: process.stdin, output: process.stdout});

var createdb = function() {
  var db = new sqlite3.Database("gamenight.db"); 
  db.serialize( function() {
    db.run("create table users (name TEXT, password TEXT, email TEXT, phone TEXT, admin INTEGER)");
    db.run("insert into users (name,password,email,phone,admin) VALUES ('administrator', 'password', 'timgarwood@gmail.com', '111-111-1111', 1)");
    db.run("create table events (date TEXT)");
  });

  db.all("SELECT * from users", function(err, rows) {
    for(var i = 0; i < rows.length; ++i) {
      console.log(rows[i]);
    }
    db.close();
    console.log("done");
  });
}

if(fs.existsSync("gamenight.db")) {
  input.question("This will overwrite the existing database. Continue? (Y/N)", 
       function(answer) {
        if(answer == "Y" || answer == "y") {
          fs.unlinkSync("gamenight.db");
          createdb();
        }
        return;
       });
} else {
  createdb();
}

console.log("done2");


