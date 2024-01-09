const mysql = require("mysql");
const http = require("http");
const url = require("url");
const bcrypt = require("bcrypt");
const dotenv = require("dotenv");

dotenv.config({ path: "backend/config/config.env" });

const DB_connection = mysql.createConnection({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

DB_connection.connect((err, data) => {
  // DB CONNECTION
  if (err) {
    return console.log(err);
  } else {
    console.log(data);
    return console.log("connected to the Database");
  }
});

var connection = http.createServer((req, res) => {
  // CREATE A SERVER
  const path = url.parse(req.url).pathname;
  console.log(path);

  switch (
    path // CLASSIFY A PATH USING SWITCH / CASE
  ) {
    case "/api/User/users": // GET API - ALL REGISTERED USERS FROM DB
      if (req.method === "GET") {
        getAllUsers(req, res);
      } else {
        res.writeHead(405, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Method Not Allowed" }));
      }
      break;
    case "/api/User/registration": // REGISTRATON API
      console.log(req.method === "POST");
      if (req.method === "POST") {
        userRegistration(req, res);
      } else {
        res.writeHead(406, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Method Not Allowed" }));
      }
      break;
    case "/api/User/login": // LOGIN API
      if (req.method === "POST") {
        userLogIn(req, res);
      } else {
        res.writeHead(407, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Method Not Allowed" }));
      }
      break;
    case "/api/User/:id":
      console.log("fsdfhdsdbsjvsvbsj>>>>>>>>>>");
      if (req.method === "DELETE") {
        deleteAllUser(req, res);
      } else {
        res.writeHead(408, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Method Not Allowed" }));
      }
      break;
    default:
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "PATH NOT FOUND" }));
      break;
  }
});

connection.listen(process.env.PORT, () => {
  // START THE SERVER
  console.log(process.env.PORT);
  console.log(`server is listing on port ${process.env.PORT}`);
});

const userRegistration = (req, res) => {
  // USER REGISTRATION METHOD
  let body = "";

  req.on("data", (chunk) => {
    body += chunk;
  });

  req.on("end", () => {
    console.log(body);
    const userData = JSON.parse(body);
    console.log(userData);

    DB_connection.query(
      "SELECT email FROM User WHERE email = ?",
      [userData.email],
      (err, data) => {
        const isValidEmail =
          /^[a-zA-Z0-9._-]+@[a-zA-Z.-]+\.[a-zA-Z]{2,4}$/.test(userData.email); // EMAIL VALIDATION
        const isValidPassword =
          /^(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{6,16}$/.test(
            // PASSWORD VALIDATION
            userData.password
          );

        if (err) {
          res.writeHead(500, { "Content-Type": "application/json" });
          return res.end(JSON.stringify({ error: "Internal Server Error !" }));
        } else if (data.length === 0 && isValidEmail && isValidPassword) {
          bcrypt.hash(userData.password, 5, (err, hash) => {
            // HASHING A PASSWORD
            console.log(hash);
            console.log(hash.length);
            if (err) {
              res.writeHead(501, { "Content-Type": "application/json" });
              res.end(JSON.stringify({ error: "Internal Server Error !!" }));
            } else {
              DB_connection.query(
                "INSERT INTO User (name,email,password) VALUES (?,?,?)", // STORE INTO A DB
                [userData.name, userData.email, hash],
                (err, data) => {
                  if (err) {
                    console.log(err);
                    res.writeHead(502, { "Content-Type": "application/json" });
                    res.end(
                      JSON.stringify({ error: "Internal Server Error !!!" })
                    );
                  } else {
                    console.log(data);
                    res.writeHead(201, { "Content-Type": "application/json" });
                    res.end(
                      JSON.stringify({
                        message: "User Registered Successfully",
                      })
                    );
                  }
                }
              );
            }
          });
        } else if (!isValidEmail) {
          res.writeHead(400, { "content-type": "application/json" });
          return res.end(
            JSON.stringify("Email must be satisfy the condition !!!")
          );
        } else if (!isValidPassword) {
          res.writeHead(401, { "content-type": "application/json" });
          return res.end(
            JSON.stringify("Password must be satisfy the condition !!!")
          );
        } else {
          res.writeHead(409, { "content-type": "application/json" });
          return res.end(JSON.stringify("Email is already taken"));
        }
      }
    );
  });
};

const userLogIn = (req, res) => {
  // USER LOG IN METHOD

  let body = "";

  req.on("data", (chunk) => {
    console.log(chunk);
    body += chunk;
  });

  req.on("end", () => {
    console.log(body);
    const logInData = JSON.parse(body);

    DB_connection.query(
      "SELECT * FROM User WHERE email = ?",
      [logInData.email],
      (err, data) => {
        console.log(data, "?????????????????????????????????????????????");
        if (err) {
          res.writeHead(500, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Internal Server error !!!!" }));
        } else if (data.length === 0) {
          res.writeHead(401, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Unauthorized - User not found" }));
        } else {
          const user = data[0];

          bcrypt.compare(logInData.password, user.password, (err, isValid) => {
            if (err || !isValid) {
              res.writeHead(401, { "Content-Type": "application/json" });
              res.end(JSON.stringify({ error: "Invalid password" }));
            } else {
              res.writeHead(200, { "Content-Type": "application/json" });
              res.end(JSON.stringify({ message: "Login successful" }));
            }
          });
        }
      }
    );
  });
};

const getAllUsers = (req, res) => {
  // GET ALL USER
  DB_connection.query("SELECT * FROM User", (err, data) => {
    if (err) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Error in retrieving data" }));
    } else {
      console.log(data);
      res.writeHead(201, { "Content-Type": "application/json" });
      res.end(JSON.stringify(data));
    }
  });
};
