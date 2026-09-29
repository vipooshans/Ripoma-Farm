import mongoose from 'mongoose';

const connectDB = async () => {
  const requireMongo = process.env.REQUIRE_MONGODB === 'true';
  try {
    const connString = process.env.MONGODB_URI || 'mongodb://localhost:27017/ripoma_farm';
    console.log(`Connecting to MongoDB at: ${connString.replace(/\/\/[^@/]+@/, '//***:***@')}`);
    
    // Atlas replica sets can take several seconds to select a server on cold start
    const conn = await mongoose.connect(connString, {
      serverSelectionTimeoutMS: 15000, 
    });
    
    global.dbConnected = true;
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    global.dbConnected = false;
    console.error(`MongoDB Connection Error: ${error.message}`);
    if (requireMongo) {
      console.error('❌ REQUIRE_MONGODB=true — refusing to start without MongoDB. Check MONGODB_URI and the Atlas IP access list.');
      process.exit(1);
    }
    console.warn('⚠️ MongoDB not running or connection string invalid.');
    console.warn('⚠️ SERVER FALLING BACK TO LOCAL JSON DATABASE SYSTEM (Friction-Free Mode).');
  }
};

export default connectDB;
