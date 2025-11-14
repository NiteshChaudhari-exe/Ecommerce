const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

let io = null;

/**
 * Initialize Socket.io server
 * @param {http.Server} httpServer - Express HTTP server instance
 * @returns {Server} Socket.io instance
 */
function initializeSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  // Middleware: authenticate socket connections using JWT
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication required'));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      socket.user = decoded; // Attach user info to socket
      next();
    } catch (err) {
      next(new Error('Invalid token'));
    }
  });

  // Connection handler
  io.on('connection', (socket) => {
    const userId = socket.user.id;
    const userRole = socket.user.role;

    console.log(`[Socket] User ${userId} (${userRole}) connected. Socket ID: ${socket.id}`);

    // Join admin/manager room for admin-only events
    if (userRole === 'admin' || userRole === 'manager') {
      socket.join('admin-room');
    }

    // Join a user-specific room for personal updates
    socket.join(`user:${userId}`);

    // Disconnect handler
    socket.on('disconnect', () => {
      console.log(`[Socket] User ${userId} disconnected. Socket ID: ${socket.id}`);
    });

    // Optional: ping/pong for connection check
    socket.on('ping', (callback) => {
      callback({ message: 'pong', timestamp: Date.now() });
    });
  });

  console.log('[Socket.io] Server initialized');
  return io;
}

/**
 * Emit event to admin room
 * @param {string} event - Event name (e.g., 'order:created')
 * @param {object} data - Event payload
 */
function emitToAdmins(event, data) {
  if (!io) {
    console.warn('[Socket] io not initialized, skipping emit');
    return;
  }
  io.to('admin-room').emit(event, {
    event,
    data,
    timestamp: Date.now(),
  });
  console.log(`[Socket] Emitted ${event} to admin-room`);
}

/**
 * Emit event to specific user
 * @param {string} userId - User ID
 * @param {string} event - Event name
 * @param {object} data - Event payload
 */
function emitToUser(userId, event, data) {
  if (!io) {
    console.warn('[Socket] io not initialized, skipping emit');
    return;
  }
  io.to(`user:${userId}`).emit(event, {
    event,
    data,
    timestamp: Date.now(),
  });
  console.log(`[Socket] Emitted ${event} to user:${userId}`);
}

/**
 * Broadcast event to all connected clients
 * @param {string} event - Event name
 * @param {object} data - Event payload
 */
function broadcast(event, data) {
  if (!io) {
    console.warn('[Socket] io not initialized, skipping emit');
    return;
  }
  io.emit(event, {
    event,
    data,
    timestamp: Date.now(),
  });
  console.log(`[Socket] Broadcasted ${event} to all clients`);
}

/**
 * Get Socket.io instance
 */
function getIO() {
  return io;
}

module.exports = {
  initializeSocket,
  emitToAdmins,
  emitToUser,
  broadcast,
  getIO,
};
