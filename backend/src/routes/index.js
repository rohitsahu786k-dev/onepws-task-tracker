const express = require('express');
const router = express.Router();
const authRoutes = require('./authRoutes');

// Mount routes
router.use('/auth', authRoutes);

// Health check
router.get('/health', (req, res) => {
  res.json({ success: true, message: 'OnePWS API is running', timestamp: new Date() });
});

module.exports = router;
