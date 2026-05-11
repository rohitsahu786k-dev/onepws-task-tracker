require('dotenv').config();
const http = require('http');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');

const connectDB = require('./config/db');
const corsOptions = require('./config/cors');
const { initSocket } = require('./config/socket');
require('./config/passport'); // Register JWT + Google strategies

const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler.middleware');
const logger = require('./utils/logger');

const app = express();

// ── Security & Logging ────────────────────────────────────────────────────────
app.use(helmet());
app.use(cors(corsOptions));
app.use(morgan('combined', { stream: { write: (msg) => logger.info(msg.trim()) } }));

// ── Body Parsing ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── Static Uploads ────────────────────────────────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ── API Routes ────────────────────────────────────────────────────────────────
app.use('/api', routes);

// ── 404 ───────────────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found.` });
});

// ── Global Error Handler ──────────────────────────────────────────────────────
app.use(errorHandler);

// ── Bootstrap ─────────────────────────────────────────────────────────────────
const registerCronJobs = require('./jobs');

const startServer = async () => {
  await connectDB();
  
  if (process.env.ENABLE_CRON_JOBS !== "false") {
    registerCronJobs();
  }

  const httpServer = http.createServer(app);
  const io = initSocket(httpServer);

  // Attach io to app for use in controllers
  app.set('io', io);

  const PORT = process.env.PORT || 5000;
  httpServer.listen(PORT, () => {
    logger.info(`
🚀 OnePWS Marketing API
   Mode:    ${process.env.NODE_ENV}
   URL:     http://localhost:${PORT}
   API:     http://localhost:${PORT}/api
   Health:  http://localhost:${PORT}/api/health
    `);
  });
};

startServer().catch((err) => {
  logger.error('Server failed to start:', err);
  process.exit(1);
});
