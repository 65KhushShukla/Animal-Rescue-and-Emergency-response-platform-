const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer = null;

const connectDB = async () => {
  const primaryUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/animal_rescue_db';

  try {
    // Attempt connecting to the configured URI (Local MongoDB or Atlas)
    console.log(`[DB] Attempting connection to MongoDB: ${primaryUri}`);
    
    // Set a short timeout for initial probe if local mongo is down
    await mongoose.connect(primaryUri, {
      serverSelectionTimeoutMS: 3000,
    });
    
    console.log(`[DB] Successfully connected to MongoDB at ${mongoose.connection.host}`);
  } catch (err) {
    console.warn(`[DB] Could not connect to primary MongoDB (${err.message}).`);
    console.log('[DB] Initializing embedded MongoDB Memory Server for zero-config offline execution...');
    
    try {
      mongoServer = await MongoMemoryServer.create({
        instance: {
          launchTimeout: 60000,
        },
      });
      const memUri = mongoServer.getUri();
      
      await mongoose.connect(memUri);
      console.log(`[DB] Connected to embedded MongoDB Memory Server (${memUri})`);
    } catch (memErr) {

      console.error('[DB] Fatal Error starting embedded Mongo Server:', memErr.message);
      process.exit(1);
    }
  }

  // Handle connection events
  mongoose.connection.on('error', (err) => {
    console.error(`[DB Error]: ${err.message}`);
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('[DB] MongoDB disconnected.');
  });
};

module.exports = connectDB;
