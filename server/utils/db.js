const mongoose = require("mongoose");
require("dotenv").config();

const URI = process.env.MONGO_DB_URI;

const connectDb = async () => {
  try {
    await mongoose.connect(URI);
    console.log("MongoDB Connected");
  } catch (err) {
    console.error("Error in connecting Database:", err.message);
    process.exit(1);
  }
};

module.exports = connectDb;