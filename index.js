const mongoose = require("mongoose");
mongoose.connect("mongodb://127.0.0.1:27017/user_management_system");

const config = require("./config/config");

const express = require("express");

const session = require("express-session");

const app = express();

// Session
app.use(
  session({
    secret: config.sessionSecret,
    resave: false,
    saveUninitialized: false,
  }),
);

//For user routes
const userRoute = require("./routes/userRoute");
app.use("/", userRoute);

//For Admin routes
const adminRoute = require("./routes/adminRoute");
app.use("/admin", adminRoute);

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
