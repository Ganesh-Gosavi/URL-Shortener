const mongoose = require("mongoose");
const shortId = require("shortid"); // For generating unique short URLs

const shortUrlSchema = new mongoose.Schema({
  full: {
    type: String,
    required: true,
  },
  short: {
    type: String,
    required: true,
    default: shortId.generate,
  },
  clicks: {
    type: Number,
    required: true,
    default: 0,
  },
  lastAccessed: {
    type: Date,
    default: null,
  },
});

// Add an index on short field for better lookup performance
shortUrlSchema.index({ short: 1 });

module.exports = mongoose.model("ShortUrl", shortUrlSchema);
