const User = require("../models/userModel");

const bcrypt = require("bcrypt");

const randomstring = require("randomstring");

const config = require("../config/config");

const nodemailer = require("nodemailer");

const securePassword = async (password) => {
  try {
    const passwordHash = await bcrypt.hash(password, 10);
    return passwordHash;
  } catch (error) {
    console.log(error.message);
  }
};

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
        if (userData.isAdmin === 0) {
          res.render("login", {
            message: "You are not an Admin",
          });
        } else {
          req.session.user_id = userData._id;
          res.redirect("/admin/home");
        }
      } else {
        res.render("login", {
          message: "Your email and password are incorrect",
        });
      }
    } else {
      res.render("login", { message: "Your email and password are incorrect" });
    }
  } catch (error) {
    console.log(error.message);
  }
};

const loadDashboard = async (req, res) => {
  try {
    const userData = await User.findById({ _id: req.session.user_id });
    res.render("home", { admin: userData });
  } catch (error) {
    console.log(error.message);
  }
};

const logout = async (req, res) => {
  try {
    req.session.destroy((error) => {
      if (error) {
        console.log(error.message);
        return res.redirect("/admin/home");
      }

      res.redirect("/admin");
    });
  } catch (error) {
    console.log(error.message);
  }
};

const forgetLoad = async (req, res) => {
  try {
    res.render("forget");
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
      html: `<p>Hi ${name}, please click <a href="http://localhost:3000/admin/reset-password?token=${token}">here</a> to reset your password.</p>`,
    };
    const info = await transporter.sendMail(mailOptions);

    console.log("FROM:", process.env.EMAIL_USER);
    console.log("TO:", email);
    console.log("Email sent successfully", info.response);
  } catch (error) {
    console.log(error.message);
  }
};

const addUserMail = async (name, email, password, user_id) => {
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
      subject: "Admin will    add you and verify your mail",
      html: `<p>Hi ${name}, please click <a href="http://localhost:3000/verify?id=${user_id}">here</a> to verify your email.</p> <br><br><b>Email :</b> ${email} <br> <b>Password :</b> ${password}`,
    };
    const info = await transporter.sendMail(mailOptions);

    console.log("FROM:", process.env.EMAIL_USER);
    console.log("TO:", email);
    console.log("Email sent successfully", info.response);
  } catch (error) {
    console.log(error.message);
  }
};

const forgetVerify = async (req, res) => {
  try {
    const email = req.body.email;
    const userData = await User.findOne({ email: email });
    if (userData) {
      if (userData.isAdmin === 0) {
        res.render("forget", { message: "Email is incorect" });
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
      res.render("forget", { message: "Email is incorect" });
    }
  } catch (error) {
    console.log(error.message);
  }
};

const forgetPasswordLoad = async (req, res) => {
  try {
    const token = req.query.token;
    const tokenData = await User.findOne({ token: token });
    if (tokenData) {
      res.render("reset-password", { user_id: tokenData._id });
    } else {
      res.render("404", { message: "Invalid link" });
    }
  } catch (error) {
    console.log(error.message);
  }
};

//Password reset Post
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
        const securePass = await securePassword(password);
        const updatedData = await User.findByIdAndUpdate(
          { _id: user_id },
          { $set: { password: securePass, token: "" } },
        );
        res.redirect("/admin");
      }
    }
  } catch (error) {
    console.log(error.message);
  }
};

// const resetPassword = async (req, res) => {
//   try {
//     const password = req.body.password;
//     const user_id = req.body.user_id;

//     const securePass = await securePassword(password);
//     const updatedData = await User.findByIdAndUpdate(
//       { _id: user_id },
//       { $set: { password: securePass, token: "" } },
//     );
//     res.redirect("/admin");
//   } catch (error) {
//     console.log(error.message);
//   }
// };

//For Admin Dashboard
const adminDashboard = async (req, res) => {
  try {
    const userData = await User.find({ isAdmin: 0 });
    res.render("dashboard", { users: userData });
  } catch (error) {
    console.log(error.message);
  }
};
//Add New User

const newUserLoad = async (req, res) => {
  try {
    res.render("new-user");
  } catch (error) {
    console.log(error.message);
  }
};

const addUser = async (req, res) => {
  try {
    const name = req.body.name;
    const email = req.body.email;
    const mobile = req.body.mobile;
    const image = req.file.filename;

    // Check duplicate name
    const nameExists = await User.findOne({ name: name });

    if (nameExists) {
      return res.render("new-user", {
        message: "Name is already taken",
      });
    }

    // Check duplicate email
    const emailExists = await User.findOne({ email: email });

    if (emailExists) {
      return res.render("new-user", {
        message: "Email is already registered",
      });
    }

    // Check duplicate mobile
    const mobileExists = await User.findOne({ mobile: mobile });

    if (mobileExists) {
      return res.render("new-user", {
        message: "Mobile number is already registered",
      });
    }

    const password = randomstring.generate(8);

    const spassword = await securePassword(password);

    const user = new User({
      name: name,
      email: email,
      mobile: mobile,
      image: image,
      password: spassword,
      isAdmin: 0,
    });

    const userData = await user.save();

    if (userData) {
      addUserMail(name, email, password, userData._id);
      res.redirect("/admin/dashboard");
    } else {
      res.render("new-user", {
        message: "Something went wrong.",
      });
    }
  } catch (error) {
    console.log(error.message);
  }
};

const editUserLoad = async (req, res) => {
  try {
    const id = req.query.id;
    const userData = await User.findById({ _id: id });
    if (userData) {
      res.render("edit-user", { user: userData });
    } else {
      req.redirect("/admin/dashboard");
    }
  } catch (error) {
    console.log(error.message);
  }
};

const updateUser = async (req, res) => {
  try {
    const id = req.body.id;
    const name = req.body.name;
    const email = req.body.email;
    const mobile = req.body.mobile;
    const verify = req.body.verify;

    // Check duplicate name
    const nameExists = await User.findOne({
      name: name,
      _id: { $ne: id },
    });

    if (nameExists) {
      const userData = await User.findById(id);

      return res.render("edit-user", {
        user: userData,
        message: "Name is already taken",
      });
    }

    // Check duplicate email
    const emailExists = await User.findOne({
      email: email,
      _id: { $ne: id },
    });

    if (emailExists) {
      const userData = await User.findById(id);

      return res.render("edit-user", {
        user: userData,
        message: "Email is already taken",
      });
    }

    // Update user
    await User.findByIdAndUpdate(
      { _id: id },
      {
        $set: {
          name: name,
          email: email,
          mobile: mobile,
          isVerified: verify,
        },
      },
    );

    res.redirect("/admin/dashboard");
  } catch (error) {
    console.log(error.message);
  }
};

//Delete User

const deleteUser = async (req, res) => {
  try {
    const id = req.query.id;
    const updatedData = await User.deleteOne({ _id: id });
    res.redirect("/admin/dashboard");
  } catch (error) {
    console.log(error.message);
  }
};

//Edit Admin Details

const editAdminLoad = async (req, res) => {
  try {
    const id = req.session.user_id;

    const adminData = await User.findById(id);

    if (adminData) {
      res.render("edit-admin", { admin: adminData });
    } else {
      res.redirect("/admin/home");
    }
  } catch (error) {
    console.log(error.message);
  }
};

const updateAdmin = async (req, res) => {
  try {
    const id = req.session.user_id;

    const updateData = {
      name: req.body.name,
      email: req.body.email,
      mobile: req.body.mobile,
    };

    if (req.file) {
      updateData.image = req.file.filename;
    }

    await User.findByIdAndUpdate(id, {
      $set: updateData,
    });

    res.redirect("/admin/home");
  } catch (error) {
    console.log(error.message);
  }
};

module.exports = {
  loadLogin,
  verifyLogin,
  loadDashboard,
  logout,
  forgetLoad,
  forgetVerify,
  forgetPasswordLoad,
  resetPassword,
  adminDashboard,
  newUserLoad,
  addUser,
  editUserLoad,
  updateUser,
  deleteUser,
  editAdminLoad,
  updateAdmin,
};
