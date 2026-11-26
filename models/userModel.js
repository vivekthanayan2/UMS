const mongoose = require("mongoose");
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  mobile: {
    type: Number,
    required: true,
    unique: true,
  },
  isAdmin: {
    type: Number,
    required: true,
  },
  isVerified: {
    type: Number,
    default: 0,
  },
  token: {
    type: String,
    default: null,
  },
  image: {
    type: String,
    default: "",
    required: true,
  },
});

module.exports = mongoose.model("User", userSchema);
