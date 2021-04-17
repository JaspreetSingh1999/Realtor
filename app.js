
var express = require("express"),
  app = express(),
  bodyParser = require("body-parser"),
  mongoose = require("mongoose"),
  Campground = require("./models/property"),
  Comment = require("./models/comment"),
  passport = require("passport"),
  LocalStrategy = require("passport-local"),
  User = require("./models/user"),
  methodOverride = require("method-override"),
  flash = require("connect-flash");

// Requiring routes
var commentRoutes = require("./routes/comments"),
campgroundRoutes = require("./routes/properties"),
shareRoutes = require("./routes/shares"),
  indexRoutes = require("./routes/index");

  mongoose.connect("mongodb+srv://root:rooted@wfd.qmifj.mongodb.net/Realtor?retryWrites=true&w=majority",{ useNewUrlParser: true}); 


app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));
app.use(methodOverride("_method"));
app.use(flash());

// PASSPORT CONFIG
app.use(
  require("express-session")({
    secret: "shibas are the best dogs in the world.",
    resave: false,
    saveUninitialized: false
  })
);
app.locals.moment = require("moment");
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(function(req, res, next) {
  res.locals.currentUser = req.user;
  res.locals.error = req.flash("error");
  res.locals.success = req.flash("success");
  next();
});

app.use("/", indexRoutes);
app.use("/properties/", campgroundRoutes);
app.use("/properties/:id/comments", commentRoutes);

app.use("/properties/:id/shares", shareRoutes);
 
app.get("/campgrounds", function(req, res) {
  res.redirect("/home");
});
app.get("*", function(req, res) {
  res.render("error");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, function(){
  console.log("Realtor server has started!");
});
