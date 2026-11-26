const express = require("express");
const admin_route = express();

const adminAuth = require("../middleware/adminAuth");

admin_route.use(express.json());
admin_route.use(express.urlencoded({ extended: true }));

admin_route.set("view engine", "ejs");
admin_route.set("views", "./views/admin");

const multer = require("multer");
const path = require("path");

admin_route.use(express.static("public"));

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "../public/userImages"));
  },
  filename: function (req, file, cb) {
    const name = Date.now() + "-" + file.originalname;
    cb(null, name);
  },
});

const upload = multer({ storage: storage });

const adminController = require("../controllers/adminController");

admin_route.get("/", adminAuth.isLogout, adminController.loadLogin);

admin_route.post("/", adminController.verifyLogin);

admin_route.get("/home", adminAuth.isLogin, adminController.loadDashboard);

admin_route.get("/logout", adminAuth.isLogin, adminController.logout);

admin_route.get("/forget", adminAuth.isLogout, adminController.forgetLoad);

admin_route.post("/forget", adminController.forgetVerify);

admin_route.get(
  "/reset-password",
  adminAuth.isLogout,
  adminController.forgetPasswordLoad,
);

admin_route.post("/reset-password", adminController.resetPassword);

admin_route.get(
  "/dashboard",
  adminAuth.isLogin,
  adminController.adminDashboard,
);

admin_route.get("/new-user", adminAuth.isLogin, adminController.newUserLoad);

admin_route.post("/new-user", upload.single("image"), adminController.addUser);

admin_route.get("/edit-user", adminAuth.isLogin, adminController.editUserLoad);

admin_route.post("/edit-user", adminController.updateUser);

admin_route.get("/delete-user", adminAuth.isLogin, adminController.deleteUser);

admin_route.get(
  "/edit-admin",
  adminAuth.isLogin,
  adminController.editAdminLoad,
);

admin_route.post(
  "/edit-admin",
  upload.single("image"),
  adminAuth.isLogin,
  adminController.updateAdmin,
);

admin_route.get("/*splat", (req, res) => {
  res.redirect("/admin");
});
module.exports = admin_route;
