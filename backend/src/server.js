require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');
const app = require('./app');
const connectDB = require('./config/db');

const PORT = process.env.PORT || 5000;

// ─── Create HTTP Server ───────────────────────────────────────────────────────
const server = http.createServer(app);

// ─── Socket.IO ───────────────────────────────────────────────────────────────
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Attach io to app for use in controllers
app.set('io', io);

// Socket events
io.on('connection', (socket) => {
  console.log(`🔌 Socket connected: ${socket.id}`);

  socket.on('join_room', (userId) => {
    socket.join(`user:${userId}`);
    console.log(`User ${userId} joined their room`);
  });

  socket.on('disconnect', () => {
    console.log(`🔌 Socket disconnected: ${socket.id}`);
  });
});

// ─── Boot ─────────────────────────────────────────────────────────────────────
const startServer = async () => {
  await connectDB();

  server.listen(PORT, () => {
    console.log(`
🚀 OnePWS Marketing API
   Mode:    ${process.env.NODE_ENV}
   URL:     http://localhost:${PORT}
   API:     http://localhost:${PORT}/api
   Health:  http://localhost:${PORT}/api/health
    `);
  });
};

startServer();
