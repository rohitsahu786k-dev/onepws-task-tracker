const mongoose = require('mongoose');
const logger = require('../utils/logger');

const connectDB = async () => {
  let retries = 5;
  while (retries) {
    try {
      const conn = await mongoose.connect(process.env.MONGO_URI);
      logger.info(`✅ MongoDB Connected: ${conn.connection.host}`);
      return;
    } catch (err) {
      retries -= 1;
      logger.error(`❌ MongoDB connection failed. Retries left: ${retries}. Error: ${err.message}`);
      if (retries === 0) {
        process.exit(1);
      }
      await new Promise((res) => setTimeout(res, 5000)); // wait 5s before retry
    }
  }
};

module.exports = connectDB;
