const { Server } = require('socket.io');

let io;

/**
 * Initialize Socket.IO server
 * @param {http.Server} httpServer
 * @returns {Server} io instance
 */
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL,
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout: 60000,
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
      if (!token) return next(new Error('Authentication token missing'));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);
      if (!user) return next(new Error('User not found'));

      socket.user = user;
      next();
    } catch (error) {
      next(new Error('Socket authentication failed'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.user._id.toString();
    console.log(`🔌 Socket connected: ${userId}`);

    // Automatically join user room
    socket.join(`user:${userId}`);

    // Automatically join workspace and department rooms
    socket.user.workspaces.forEach((w) => {
      if (w.workspace) {
        const workspaceId = w.workspace.toString();
        socket.join(`workspace:${workspaceId}`);
        if (w.role) {
          socket.join(`role:${workspaceId}:${w.role}`);
        }
      }
      if (w.department) {
        socket.join(`department:${w.department.toString()}`);
      }
    });

    // Custom join for specific tasks if needed
    socket.on('join_task', (taskId) => {
      socket.join(`task:${taskId}`);
    });

    socket.on('leave_task', (taskId) => {
      socket.leave(`task:${taskId}`);
    });

    socket.on('disconnect', () => {
      console.log(`🔌 Socket disconnected: ${userId}`);
    });
  });

  return io;
};

/**
 * Get the io instance (after init)
 */
const getIO = () => {
  if (!io) throw new Error('Socket.IO not initialized. Call initSocket() first.');
  return io;
};

/**
 * Emit event to a specific user
 */
const emitToUser = (userId, event, data) => {
  getIO().to(`user:${userId}`).emit(event, data);
};

/**
 * Emit event to entire workspace
 */
const emitToWorkspace = (workspaceId, event, data) => {
  getIO().to(`workspace:${workspaceId}`).emit(event, data);
};

/**
 * Emit event to all watchers of a task
 */
const emitToTask = (taskId, event, data) => {
  getIO().to(`task:${taskId}`).emit(event, data);
};

module.exports = { initSocket, getIO, emitToUser, emitToWorkspace, emitToTask };
