const isLogin = async (req, res, next) => {
  try {
    if (req.session.user_id) {
      // Prevent browser from caching protected pages
      res.set("Cache-Control", "no-store, no-cache, must-revalidate, private");
      res.set("Pragma", "no-cache");
      res.set("Expires", "0");
      return next();
    } else {
      return res.redirect("/admin");
    }
  } catch (error) {
    console.log(error.message);
  }
};

const isLogout = async (req, res, next) => {
  try {
    // Don't allow the login/forgot-password pages to be cached
    res.set("Cache-Control", "no-store, no-cache, must-revalidate, private");
    res.set("Pragma", "no-cache");
    res.set("Expires", "0");

    if (req.session.user_id) {
      return res.redirect("/admin/home");
    }

    return next();
  } catch (error) {
    console.log(error.message);
  }
};

module.exports = {
  isLogin,
  isLogout,
};
