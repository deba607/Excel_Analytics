const mongoose = require("mongoose");
require("dotenv").config();

const URI = process.env.MONGO_DB_URI;

const connectDb = async () => {
  try {
    await mongoose.connect(URI,{
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("MongoDB Connected");
  } catch (err) {
    console.error("Error in connecting Database.",err.message);
    process.exit(0);
    }
};

module.exports = connectDb;