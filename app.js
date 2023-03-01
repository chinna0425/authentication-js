const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const app = express();
app.use(express.json());
const bcrypt = require("bcrypt");
let db_path = path.join(__dirname, "userData.db");
let db = null;

let initializationofdbandserver = async () => {
  try {
    db = await open({
      filename: db_path,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server running at http://localhost:3000");
    });
  } catch (error) {
    console.log(`DB Error ${error.message}`);
    process.exit(1);
  }
};
initializationofdbandserver();

//API POST

app.post("/register", async (request, response) => {
  let { username, name, password, gender, location } = request.body;
  let encryptpass = await bcrypt.hash(password, 10);
  let userquery = `
    select
    *
    from user where username='${username}';`;
  let userresponse = await db.get(userquery);
  if (password.length < 5) {
    response.status(400);
    response.send("Password is too short");
  } else if (userresponse === undefined) {
    let insertquery = `
        insert into user(username,name,password,gender,location)
        values('${username}','${name}','${encryptpass}','${gender}','${location}');`;
    let resinsert = await db.run(insertquery);
    response.status(200);
    response.send("User created successfully");
  } else {
    response.status(400);
    response.send("User already exists");
  }
});

//API Login

app.post("/login", async (request, response) => {
  let { username, password } = request.body;
  console.log(username);
  console.log(password);
  let userfound = `
    select * from user where username='${username}';`;
  let userres = await db.get(userfound);
  if (userres === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    let decryptpass = await bcrypt.compare(password, userres.password);
    if (decryptpass) {
      response.status(200);
      response.send("Login success!");
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});

//API UPDATE

app.put("/change-password", async (request, response) => {
  let { username, oldPassword, newPassword } = request.body;
  console.log(username);
  let newencryptpass = await bcrypt.hash(newPassword, 10);
  let userfound = `
    select * from user where username='${username}';`;
  let res = await db.get(userfound);
  let istrueorfalse = await bcrypt.compare(oldPassword, res.password);
  console.log(istrueorfalse);
  if (istrueorfalse === false) {
    response.status(400);
    response.send("Invalid current password");
  } else {
    if (newPassword.length < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      let updatequery = `
           update user set password='${newencryptpass}' where username='${username}';`;
      let updateres = await db.run(updatequery);
      response.status(200);
      response.send("Password updated");
    }
  }
});
module.exports = app;
