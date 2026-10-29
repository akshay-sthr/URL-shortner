const { getUser } = require("../service/auth");

function restrictToLoggedinUserOnly(req, res, next) {
  const user = getUser(req.cookies?.token);
  if (!user) return res.redirect("/login");
  req.user = user;
  next();
}

function checkAuth(req, res, next) {
  req.user = getUser(req.cookies?.token);
  next();
}

module.exports = { restrictToLoggedinUserOnly, checkAuth };