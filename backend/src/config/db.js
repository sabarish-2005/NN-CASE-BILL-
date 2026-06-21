const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`✓ MongoDB Connected: ${conn.connection.host}`);
    connectDB.usingMemoryDB = false;
    return conn;
  } catch (err) {
    console.error(`✗ MongoDB Error: ${err.message}`);
    process.exit(1);
  }
};

connectDB.usingMemoryDB = false;

module.exports = connectDB;
