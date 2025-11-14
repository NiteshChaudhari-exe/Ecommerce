const mongoose = require('mongoose');
const http = require('http');
const app = require('./app');
const { startScheduledTasks } = require('./services/scheduledTasks');
const { initializeSocket } = require('./lib/socketManager');

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/ecommerce';

// Create HTTP server and attach Socket.io
const server = http.createServer(app);
initializeSocket(server);

mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      // Start scheduled background tasks
      startScheduledTasks();
    });
  })
  .catch((err) => console.error('MongoDB connection error:', err));
