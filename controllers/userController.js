const User = require("../models/userModel");

require("dotenv").config();

const bcrypt = require("bcrypt");

const nodemailer = require("nodemailer");

const randomstring = require("randomstring");

const sendVerificationEmail = async (name, email, user_id) => {
  // Implementation for sending verification email
  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      requireTLS: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "For Verification Email",
      html: `<p>Hi ${name}, please click <a href="http://localhost:3000/verify?id=${user_id}">here</a> to verify your email.</p>`,
    };
    const info = await transporter.sendMail(mailOptions);

    console.log("FROM:", process.env.EMAIL_USER);
    console.log("TO:", email);
    console.log("Email sent successfully", info.response);
  } catch (error) {
    console.log(error.message);
  }
};

const securePassword = async (password) => {
  try {
    const passwordHash = await bcrypt.hash(password, 10);
    return passwordHash;
  } catch (error) {
    console.log(error.message);
  }
};

//forgot password email sending function
const sendResetPasswordEmail = async (name, email, token) => {
  // Implementation for sending reset password email
  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      requireTLS: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Reset Password Email",
      html: `<p>Hi ${name}, please click <a href="http://localhost:3000/reset-password?token=${token}">here</a> to reset your password.</p>`,
    };
    const info = await transporter.sendMail(mailOptions);

    console.log("FROM:", process.env.EMAIL_USER);
    console.log("TO:", email);
    console.log("Email sent successfully", info.response);
  } catch (error) {
    console.log(error.message);
  }
};

const loadRegister = async (req, res) => {
  try {
    res.render("registration");
  } catch (error) {
    console.log(error.message);
  }
};

const insertUser = async (req, res) => {
  try {
    const nameExists = await User.findOne({ name: req.body.name });

    if (nameExists) {
      return res.render("registration", {
        message: "Name already exists",
      });
    }

    const emailExists = await User.findOne({
      email: req.body.email,
    });

    if (emailExists) {
      return res.render("registration", {
        message: "Email already exists",
      });
    }

    const mobileExists = await User.findOne({ mobile: req.body.mobile });
    if (mobileExists) {
      return res.render("registration", {
        message: "Mobile number already exists",
      });
    }

    const spassword = await securePassword(req.body.password);
    const user = new User({
      name: req.body.name,
      email: req.body.email,
      mobile: req.body.mobile,
      image: req.file.filename,
      password: spassword,
      isAdmin: 0,
    });
    const userData = await user.save();
    if (userData) {
      sendVerificationEmail(req.body.name, req.body.email, userData._id);
      res.render("registration", {
        message: "Your registration has been successfully completed",
      });
    } else {
      res.render("registration", {
        message: "Your registration has not been completed",
      });
    }
  } catch (error) {
    console.log(error.message);
  }
};

const verifyEmail = async (req, res) => {
  try {
    const updateInfo = await User.updateOne(
      { _id: req.query.id },
      { $set: { isVerified: 1 } },
    );
    (console.log(updateInfo), res.render("email-verified"));
  } catch (error) {
    console.log(error.message);
  }
};

//login user methods started

const loadLogin = async (req, res) => {
  try {
    res.render("login");
  } catch (error) {
    console.log(error.message);
  }
};

const verifyLogin = async (req, res) => {
  try {
    const email = req.body.email;
    const password = req.body.password;

    const userData = await User.findOne({ email: email });

    if (userData) {
      const passwordMatch = await bcrypt.compare(password, userData.password);

      if (passwordMatch) {
        // Prevent admin from logging in through user login
        if (userData.isAdmin === 1) {
          return res.render("login", {
            message: "Admins cannot login here",
          });
        }

        if (userData.isVerified === 0) {
          return res.render("login", {
            message: "Please verify your email",
          });
        } else {
          req.session.user_id = userData._id;
          return res.redirect("/home");
        }
      } else {
        return res.render("login", {
          message: "Email and password is incorrect",
        });
      }
    } else {
      return res.render("login", {
        message: "Email and password is incorrect",
      });
    }
  } catch (error) {
    console.log(error.message);
  }
};

const loadHome = async (req, res) => {
  try {
    const userData = await User.findById(req.session.user_id);

    res.render("home", { user: userData });
  } catch (error) {
    console.log(error.message);
  }
};
//forgot password methods started
const loadForget = async (req, res) => {
  try {
    res.render("forget");
  } catch (error) {
    console.log(error.message);
  }
};

const forgetPassword = async (req, res) => {
  try {
    const email = req.body.email;
    const userData = await User.findOne({ email: email });
    if (userData) {
      if (userData.isVerified === 0) {
        res.render("forget", { message: "Please verify your email" });
      } else {
        const randomString = randomstring.generate();
        const updatedData = await User.updateOne(
          { email: email },
          { $set: { token: randomString } },
        );
        sendResetPasswordEmail(userData.name, userData.email, randomString);
        res.render("forget", {
          message: "Please check your email to reset your password",
        });
      }
    } else {
      res.render("forget", { message: "Email is incorrect" });
    }
  } catch (error) {
    console.log(error.message);
  }
};

const resetPasswordLoad = async (req, res) => {
  try {
    const token = req.query.token;
    const tokenData = await User.findOne({ token: token });
    if (tokenData) {
      res.render("reset-password", { user_id: tokenData._id });
    } else {
      res.render("404", { message: "Token is invalid" });
    }
  } catch (error) {
    console.log(error.message);
  }
};

const resetPassword = async (req, res) => {
  try {
    const password = req.body.password;
    const user_id = req.body.user_id;

    const userData = await User.findById({ _id: user_id });
    if (userData) {
      const passwordMatch = await bcrypt.compare(password, userData.password);
      if (passwordMatch) {
        res.render("reset-password", {
          message: "This password has already been used.",
          user_id: user_id,
        });
      } else {
        const secure_password = await securePassword(password);
        const updatedData = await User.findByIdAndUpdate(
          { _id: user_id },
          { $set: { password: secure_password, token: "" } },
        );
        res.redirect("/");
      }
    }
  } catch (error) {
    console.log(error.message);
  }
};

const userLogout = async (req, res) => {
  try {
    req.session.destroy((error) => {
      if (error) {
        console.log(error.message);
        return res.redirect("/home");
      }
    });
    res.redirect("/");
  } catch (error) {
    console.log(error.message);
  }
};
//for verification mail
const verificationLoad = async (req, res) => {
  try {
    res.render("verification");
  } catch (error) {
    console.log(error.message);
  }
};

const sendVerificationLink = async (req, res) => {
  try {
    const email = req.body.email;
    const userData = await User.findOne({ email: email });
    if (userData) {
      if (userData.isVerified === 1) {
        res.render("verification", { message: "Email is already verified" });
      } else {
        sendVerificationEmail(userData.name, userData.email, userData._id);
        res.render("verification", {
          message: "Please check your email to verify your account",
        });
      }
    } else {
      res.render("verification", { message: "Email is incorrect" });
    }
  } catch (error) {
    console.log(error.message);
  }
};

//User profile edit and Update
const editLoad = async (req, res) => {
  try {
    const id = req.query.id;
    const userData = await User.findById({ _id: id });
    if (userData) {
      res.render("edit", { user: userData });
    } else {
      res.redirect("/home");
    }
  } catch {
    console.log(error.message);
  }
};

const updateProfile = async (req, res) => {
  try {
    if (req.file) {
      const userData = await User.findByIdAndUpdate(
        { _id: req.body.user_id },
        {
          $set: {
            name: req.body.name,
            email: req.body.email,
            mobile: req.body.mobile,
            image: req.file.filename,
          },
        },
      );
    } else {
      const userData = await User.findByIdAndUpdate(
        { _id: req.body.user_id },
        {
          $set: {
            name: req.body.name,
            email: req.body.email,
            mobile: req.body.mobile,
          },
        },
      );
    }
    res.redirect("/home");
  } catch (error) {
    console.log(error.message);
  }
};

module.exports = {
  loadRegister,
  insertUser,
  verifyEmail,
  loadLogin,
  verifyLogin,
  loadHome,
  loadForget,
  forgetPassword,
  resetPasswordLoad,
  resetPassword,
  userLogout,
  verificationLoad,
  sendVerificationLink,
  editLoad,
  updateProfile,
};
