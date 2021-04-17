var express = require("express");
var router = express.Router({ mergeParams: true });
var Property = require("../models/property");
var Share = require("../models/share");
var middleware = require("../middleware");
var nodemailer = require('nodemailer');
const user = require("../models/user");
const campground = require("../models/property");
var fs = require("fs");
var ejs = require("ejs");

var transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'realtory2021@gmail.com',
    pass: '2021realtory'
  }
});


// shares create
router.post("/", middleware.isLoggedIn, function (req, res) {
  Property.findById(req.params.id, function (err, found) {
    if (err) {
      console.log(err);
    }
    var ratedArray = [];
    found.isInterested.forEach(function (rated) {
      ratedArray.push(String(rated));
    });
    if (ratedArray.includes(String(req.user._id))) {
      req.flash(
        "error",
        "You've already shown interest in this property, please edit your interest instead."
      );
      res.redirect("/Properties/purpose/" + req.params.id);
    } else {
      Property.findById(req.params.id, function (err, campground) {
        if (err) {
          console.log(err);
          res.redirect("/home");
        } else {
          Property.findById(req.params.id).populate('isInterested').exec(function (err, campg) {
            if (err) {
              console.log(err);
              res.redirect("/home");
            } else {
              var newShare = req.body.share;
              Share.create(newShare, function (err, share) {
                if (err) {
                  req.flash("error", "Something went wrong.");
                  res.render("error");
                } else {
                  // add username and id to comment
                  share.author.id = req.user._id;
                  share.author.username = req.user.username;
                  campground.isInterested.push(req.user._id);
                  campground.totalInterest += share.percent;
                  if (campground.totalInterest >= 85) {
                    user.findById(req.user._id, (err, user) => {
                      if (err) {
                        console.log(err);
                        res.redirect("/home");
                      } else {
                        emails = user.email;
                        campg.isInterested.forEach(us => {
                          emails += ', ' + us.email;
                        });
                        var mailOptions = {
                          from: 'realtory2021@gmail.com',
                          to: emails,
                          subject: 'Greeting from Realtor, we have good news!',
                          text: 'The property,' + campground.name + ' you were interested in has crossed 85% in interested investors, you can contact them with their emails.\n Here is a list of emails belonging to everyone interested in this property'+emails
                        }
                        

                       

                        transporter.sendMail(mailOptions, function (error, info) {
                          if (error) {
                            console.log(error);
                          } else {
                            console.log('Email sent: ' + info.response);
                          }

                        });
                      }
                    });

                  }

                  //campground.rateCount = campground.comments.length;
                  // save comment
                  share.save();
                  campground.shares.push(share);
                  campground.save();
                  req.flash("success", "Successfully added interest!");
                  res.redirect("/Properties/purpose/" + campground._id);
                }
              });
            }
          });
        }
      });
    }
  });
});

// COMMENT UPDATE ROUTE
  router.put("/:comment_id", middleware.checkShareOwnership, function (req,res) {
    Share.findById(req.params.comment_id, function (
      err,
      share
    ) {
      if (err) {
        console.log("\n\n\nerror in line 111\n\n",err);
        res.redirect("back");
      } else {
       
      percentChange = req.body.share.percent - share.percent;
      share.percent += percentChange;
      share.save();
      console.log("share percent changed in db")
            
      Property.findById(req.params.id).populate('isInterested').exec((err, property)=>{
        if("\n\nError in line 120\n\n\n",err)
        {
          console.log(err);
        }
        else{
        property.totalInterest+=percentChange;
        property.save();
        console.log("totInterest updated");
        if(property.totalInterest  >= 85 )
        {
          var emails = "";
          property.isInterested.forEach(us => {
            emails +=  us.email + ', ';
          });
          emails = emails.slice(0,emails.length -1 )
          var text = 'The property,' + property.name + ' you were interested in has crossed 85% in interested investors, you can contact them with their emails.\n Here is a list of emails belonging to everyone interested in this property: \n'+emails
          
          ejs.renderFile( "./views/emails/interested.ejs", {title : property.name, image : property.image, content : text }, function (err, data) {
            if (err) {
                console.log(err);
            } else {
                var mainOptions = {
                  from: 'realtory2021@gmail.com',
                  to: emails,
                  subject: 'Greeting from Realtor, we have good news!',
                    html: data
                };
                
                transporter.sendMail(mainOptions, function (err, info) {
                    if (err) {
                        console.log(err);
                    } else {
                        console.log('Message sent: ' + info.response);
                    }
                });
            }
            
            });
        }
      }
      });
        
    
      req.flash("success", "Share updated!");
        res.redirect("/Properties/purpose/" + req.params.id);
      
    
      }
    });

  });

  // DESTROY COMMENT ROUTE
  router.delete("/:comment_id/:percent", middleware.checkShareOwnership, function (
    req,
    res
  ) {
    console.log("Share delete route");
    Share.findByIdAndRemove(req.params.comment_id, function (err) {
      if (err) {
        res.redirect("back");
      } else {
        Property.findByIdAndUpdate(
          req.params.id,
          { $pull: { shares: { $in: [req.params.comment_id] } } },
          function (err) {
            if (err) {
              console.log(err);
            }
          }
        );
        Property.findByIdAndUpdate(
          req.params.id,
          { $pull: { isInterested: { $in: [req.user._id] } } },
          function (err) {
            if (err) {
              console.log(er);
            }
          }
        );
        per = -1 * Number(req.params.percent)
        Property.findByIdAndUpdate(
          req.params.id,
          { $inc: { totalInterest: per } },
          function (err) {
            if (err) {
              console.log(er);
            }
          }
        );
        req.flash("success", "Review deleted!");
        res.redirect("/Properties/purpose" + req.params.id);
      }
    });
  });

  module.exports = router;
