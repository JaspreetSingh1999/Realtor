var mongoose = require("mongoose");

// SCHEME SETUP
var propertySchema = new mongoose.Schema({
  name: String,
  price: Number,
  image: String,
  imageId: String,
  description: String,
  location: String,
  lat: Number,
  lng: Number,
  area: Number,
  phone: String,
  road: Number,
  type: String,
  purpose: String,
  tags: [],
  createdAt: { type: Date, default: Date.now },
  author: {
    id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    username: String
  },
  comments: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Comment"
    }
  ],
  shares: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Share"
    }
  ],
  totalInterest:  { type: Number, default: 0 },
  rateAvg: Number,
  rateCount: Number,
  hasRated: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }
  ],
  isInterested: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }
  ]
});

module.exports = mongoose.model("Property", propertySchema);
