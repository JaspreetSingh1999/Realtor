var mongoose = require("mongoose");

var shareSchema = new mongoose.Schema({
  createdAt: { type: Date, default: Date.now },
  author: {
    id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    username: String
  },
  percent: Number
});

module.exports = mongoose.model("Share", shareSchema);
