const bcrypt = require("bcryptjs");
const User = require("../models/user");
const { setUser } = require("../service/auth");

const cookieOptions = {
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

async function handleUserSignup(req, res) {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password || password.length < 6) {
      return res.status(400).render("signup", {
        error: "Name, email and a password of at least 6 characters are required",
      });
    }

    const hashed = await bcrypt.hash(password, 10);
    await User.create({ name, email: email.toLowerCase().trim(), password: hashed });
    return res.redirect("/login");
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).render("signup", { error: "Email is already registered" });
    }
    console.error(err);
    return res.status(500).render("signup", { error: "Something went wrong" });
  }
}

async function handleUserLogin(req, res) {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: (email || "").toLowerCase().trim() });
    const ok = user && (await bcrypt.compare(password || "", user.password));

    if (!ok) {
      return res.status(401).render("login", { error: "Invalid email or password" });
    }

    res.cookie("token", setUser(user), cookieOptions);
    return res.redirect("/");
  } catch (err) {
    console.error(err);
    return res.status(500).render("login", { error: "Something went wrong" });
  }
}

function handleUserLogout(req, res) {
  res.clearCookie("token");
  return res.redirect("/login");
}

module.exports = { handleUserSignup, handleUserLogin, handleUserLogout };