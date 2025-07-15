const mongoose = require("mongoose");
require("dotenv").config();
const { MongoClient, GridFSBucket } = require('mongodb');

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

let _gridfsBucket = null;
async function getGridFSBucket() {
  if (_gridfsBucket) return _gridfsBucket;
  const client = new MongoClient(URI);
  await client.connect();
  const db = client.db();
  _gridfsBucket = new GridFSBucket(db, { bucketName: 'uploads' });
  return _gridfsBucket;
}

module.exports = connectDb;
module.exports.getGridFSBucket = getGridFSBucket;