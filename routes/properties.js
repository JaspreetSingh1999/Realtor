var express = require("express");
var router = express.Router();
var Property = require("../models/property");
var User = require("../models/user");
var middleware = require("../middleware");
var NodeGeocoder = require("node-geocoder");
var options = {
  provider: "google",
  httpAdapter: "https",
  apiKey: process.env.GEO_CODE_API,
  formatter: null
};
var geocoder = NodeGeocoder(options);
var multer = require("multer");
var storage = multer.diskStorage({
  filename: function(req, file, callback) {
    callback(null, Date.now() + file.originalname);
  }
});
var imageFilter = function(req, file, cb) {
  // accept image files only
  if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
    return cb(new Error("Only image files are allowed!"), false);
  }
  cb(null, true);
};
var upload = multer({
  storage: storage,
  fileFilter: imageFilter
});

var cloudinary = require("cloudinary");
cloudinary.config({
  cloud_name: "dj43fftia",
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET
});

var Fuse = require("fuse.js");

// NEW - show form to create new campground
router.get("/new", middleware.isLoggedIn, function(req, res) {
  res.render("properties/new");
});

// INDEX - show all campgrounds
router.get("/:type", function(req, res) {
  var noMatch = null;
  if (req.query.search) {
    Property.find({type: req.params.type}, function(err, allCampgrounds) {
      if (err) {
        console.log(err);
      } else {        
        var options = {
          shouldSort: true,
          threshold: 0.5,
          location: 0,
          distance: 100,
          maxPatternLength: 32,
          minMatchCharLength: 2,
          keys: ["name", "location"]
        };
        var fuse = new Fuse(allCampgrounds, options);
        var result = fuse.search(req.query.search);
        if (result.length < 1) {
          noMatch = req.query.search;
        }
        res.render("properties/index", {
          campgrounds: result,
          noMatch: noMatch,
          type: req.params.type,
          returnurl: "properties/"+req.params.type
        });
      }
    });
  } else if (req.query.sortby) {
    if (req.query.sortby === "rateAvg") {
      Property.find({type: req.params.type})
        .sort({
          rateCount: -1,
          rateAvg: -1
        })
        .exec(function(err, allCampgrounds) {
          if (err) {
            console.log(err);
          } else {
            res.render("properties/index", {
              campgrounds: allCampgrounds,
              currentUser: req.user,
              noMatch: noMatch,
              type: req.params.type,
              returnurl: "properties/"+req.params.type
            });
          }
        });
    } else if (req.query.sortby === "rateCount") {
      Property.find({type: req.params.type})
        .sort({
          rateCount: -1
        })
        .exec(function(err, allCampgrounds) {
          if (err) {
            console.log(err);
          } else {
            res.render("properties/index", {
              campgrounds: allCampgrounds,
              currentUser: req.user,
              noMatch: noMatch,
              type: req.params.type,
              returnurl: "properties/"+req.params.type
            });
          }
        });
    } else if (req.query.sortby === "priceLow") {
      Property.find({type: req.params.type})
        .sort({
          price: 1,
          rateAvg: -1
        })
        .exec(function(err, allCampgrounds) {
          if (err) {
            console.log(err);
          } else {
            res.render("properties/index", {
              campgrounds: allCampgrounds,
              currentUser: req.user,
              noMatch: noMatch,
              type: req.params.type,
              returnurl: "properties/"+req.params.type
            });
          }
        });
    } else {
      Property.find({type: req.params.type})
        .sort({
          price: -1,
          rateAvg: -1
        })
        .exec(function(err, allCampgrounds) {
          if (err) {
            console.log(err);
          } else {
            res.render("properties/index", {
              campgrounds: allCampgrounds,
              currentUser: req.user,
              noMatch: noMatch,
              type: req.params.type,
              returnurl: "properties/"+req.params.type
            });
          }
        });
    }
  } else {
    Property.find({type: req.params.type}, function(err, allCampgrounds) {
      if (err) {
        console.log(err);
      } else {
        res.render("properties/index", {
          campgrounds: allCampgrounds,
          currentUser: req.user,
          noMatch: noMatch,
          type: req.params.type,
          returnurl: "properties/"+req.params.type
        });
      }
    });
  }
});

// CREATE - add new campground to db
router.post("/", middleware.isLoggedIn, upload.single("image"), function(
  req,
  res
) {
  cloudinary.v2.uploader.upload(
    req.file.path,
    {
      width: 1500,
      height: 1000,
      crop: "scale"
    },
    function(err, result) {
      if (err) {
        req.flash("error", err.message);
        return res.render("error");
      }
      req.body.campground.image = result.secure_url;
      req.body.campground.imageId = result.public_id;
      // req.body.campground.booking = {
      //   start: req.body.campground.lat,
      //   end: req.body.campground.lng
      // };
      req.body.campground.tags = req.body.campground.tags.split(",");
      req.body.campground.author = {
        id: req.user._id,
        username: req.user.username
      };
      req.body.campground["lat"] = parseFloat(req.body.campground["lat"])
      req.body.campground["lng"] = parseFloat(req.body.campground["lng"])
      // geocoder.geocode(req.body.campground.location, function(err, data) {
      //   if (err || !data.length) {
      //     console.log(err);
      //     req.flash("error", "Invalid address");
      //     return res.redirect("back");
      //   }
      //   req.body.campground.lat = data[0].latitude;
      //   req.body.campground.lng = data[0].longitude;
      //   req.body.campground.location = data[0].formattedAddress;
        Property.create(req.body.campground, function(err, campground) {
          if (err) {
            req.flash("error", err.message);
            return res.render("error");
          }
          res.redirect("/home");
        });
     // });
    },
    {
      moderation: "webpurify"
    }
  );
});



// SHOW - shows more information about one campground
router.get("/purpose/:id", function(req, res) {
  Property.findById(req.params.id)
    .populate("comments").populate("shares")
    .exec(function(err, foundCampground) {
      if (err || !foundCampground) {
        console.log(err);
        req.flash("error", "Sorry, that campground does not exist!");
        return res.render("error",{returnurl: "home"});
      }
      var ratingsArray = [];

      foundCampground.comments.forEach(function(rating) {
        ratingsArray.push(rating.rating);
      });
      if (ratingsArray.length === 0) {
        foundCampground.rateAvg = 0;
      } else {
        var ratings = ratingsArray.reduce(function(total, rating) {
          return total + rating;
        });
        foundCampground.rateAvg = ratings / foundCampground.comments.length;
        foundCampground.rateCount = foundCampground.comments.length;
      }
      foundCampground.save();
      if(req.isAuthenticated())
      {
        if(foundCampground.author.id != req.user.id)
        {
          User.findById(req.user._id,(err, user)=>{
            if(!user.viewed.includes(String(req.params.id)))
            {
              user.viewed.push(req.params.id);
              user.save()
            }
          });
        }
      }
        res.render("properties/show", {
          campground: foundCampground,
          returnurl: "properties/purpose/"+req.params.id
      
      });
    });
});

// EDIT CAMPGROUND ROUTE
router.get(
  "/:id/edit",
  middleware.isLoggedIn,
  middleware.checkCampgroundOwnership,
  function(req, res) {
    res.render("properties/edit", {
      campground: req.campground
    });
  }
);

// UPDATE CAMPGROUND ROUTE
router.put(
  "/:id",
  upload.single("image"),
  middleware.checkCampgroundOwnership,
  function(req, res) {
    // geocoder.geocode(req.body.campground.location, function(err, data) {
    //   if (err || !data.length) {
    //     req.flash("error", "Invalid address");
    //     return res.redirect("back");
    //   }
      // req.body.campground.lat = data[0].latitude;
      // req.body.campground.lng = data[0].longitude;
      // req.body.campground.location = data[0].formattedAddress;
      // req.body.campground.booking = {
      //   start: req.body.campground.start,
      //   end: req.body.campground.end
      // };
      req.body.campground.tags = req.body.campground.tags.split(",");
      Property.findByIdAndUpdate(
        req.params.id,
        req.body.campground,
        async function(err, campground) {
          if (err) {
            req.flash("error", err.message);
            res.redirect("back");
          } else {
            if (req.file) {
              try {
                await cloudinary.v2.uploader.destroy(campground.imageId);
                var result = await cloudinary.v2.uploader.upload(
                  req.file.path,
                  {
                    width: 1500,
                    height: 1000,
                    crop: "scale"
                  },
                  {
                    moderation: "webpurify"
                  }
                );
                campground.imageId = result.public_id;
                campground.image = result.secure_url;
              } catch (err) {
                req.flash("error", err.message);
                return res.render("error",{returnurl: "home"});
              }
            }
            campground.save();
            req.flash("success", "Successfully updated your property!");
            res.redirect("/properties/purpose/" + req.params.id);
          }
        }
      );
    
  }
);

// DESTROY Property ROUTE
router.delete("/:id", middleware.checkCampgroundOwnership, function(req, res) {
  Property.findById(req.params.id, async function(err, campground) {
    if (err) {
      req.flash("error", err.message);
      return res.redirect("back");
    }
    try {
      await cloudinary.v2.uploader.destroy(campground.imageId);
      campground.remove();
      res.redirect("/home");
    } catch (err) {
      if (err) {
        req.flash("error", err.message);
        return res.render("error", {returnurl: "home"});
      }
    }
  });
});

module.exports = router;
