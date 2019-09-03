const process = require("process");
const express = require("express");
const passport = require("passport");
const cookieParser = require("cookie-parser");
const uuid = require("uuid/v4");
const OAuth2Strategy = require("passport-oauth2");

const app = express();

app.set("view engine", "pug");
app.use(passport.initialize());
app.use(passport.session());
app.use(cookieParser());

passport.serializeUser(function(user, done) {
  done(null, user);
});

// passport.deserializeUser(function(id, done) {});

const sessions = {};

passport.use(
  new OAuth2Strategy(
    {
      authorizationURL: "https://www.algolia.com/oauth/authorize",
      tokenURL: "https://www.algolia.com/oauth/token",
      clientID: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
      callbackURL:
        "https://wnyjo5v365.sse.codesandbox.io/auth/dashboard/callback"
    },
    (accessToken, _refreshToken, params, _profile, cb) => {
      cb(null, params);
    }
  )
);

app.get("/", (req, res) => {
  res.render("index");
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.post("/logout", (req, res) => {
  delete sessions[req.cookies["_sandbox_session_id"]];
  res.redirect("/login");
});

app.get("/authorized", (req, res) => {
  const session_id = req.cookies["_sandbox_session_id"];

  if (!session_id || !sessions[session_id]) {
    // Redirect if no session has been found
    res.redirect("/login");
    return;
  }

  res.render("authorized", {
    email: sessions[session_id].email,
    name: sessions[session_id].name,
    avatar_url: sessions[session_id].avatar_url
  });
});

app.post("/auth/dashboard", passport.authenticate("oauth2"));

app.get(
  "/auth/dashboard/callback",
  passport.authenticate("oauth2", {
    failureRedirect: "/login",
    session: true
  }),
  (req, res) => {
    // Create cookie and store user info in session
    const cookie_id = uuid(req.user.user.id);
    sessions[cookie_id] = req.user.user;
    res.cookie("_sandbox_session_id", cookie_id, { httpOnly: true });
    res.redirect("/authorized");
  }
);

app.listen(8080, () => console.log("Running on port 8080"));
