const { MongoMemoryServer } = require('mongodb-memory-server');

(async () => {
  try {
    const mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    process.env.MONGO_URI = uri;
    console.log('Started in-memory MongoDB at', uri);

    // Now require the main index which will use process.env.MONGO_URI
    require('../src/index');

    // Keep process alive. When the process exits, MongoMemoryServer will be stopped.
    process.on('SIGINT', async () => {
      console.log('Shutting down in-memory MongoDB');
      await mongod.stop();
      process.exit(0);
    });
  } catch (err) {
    console.error('Failed to start in-memory MongoDB:', err);
    process.exit(1);
  }
})();
