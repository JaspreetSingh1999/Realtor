var mongoose = require("mongoose");
var passportLocalMongoose = require("passport-local-mongoose");

var UserSchema = new mongoose.Schema({
  username: String,
  password: String,
  email: String,
  phone: String,
  fullName: String,
  image: String,
  imageId: String,
  viewed: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property"
    }
  ],
  joined: { type: Date, default: Date.now }
});

UserSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("User", UserSchema);