require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Remove existing admin
    await User.deleteOne({ email: process.env.DEFAULT_ADMIN_EMAIL });

    const admin = await User.create({
      name: 'Super Admin',
      email: process.env.DEFAULT_ADMIN_EMAIL,
      password: process.env.DEFAULT_ADMIN_PASSWORD,
      role: 'super_admin',
      isVerified: true,
      isActive: true,
    });

    console.log(`✅ Super admin seeded: ${admin.email}`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed error:', err.message);
    process.exit(1);
  }
};

seed();
