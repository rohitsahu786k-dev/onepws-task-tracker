const express = require('express');
const router = express.Router({ mergeParams: true });
const { protect, verifyWorkspaceAccess, checkModuleEnabled, checkPermission } = require('../middleware/auth.middleware');
const Payment = require('../models/Payment');

router.use(protect, verifyWorkspaceAccess, checkModuleEnabled('expenses'));

router.get('/', checkPermission('expenses', 'view'), async (req, res, next) => {
  try {
    const payments = await Payment.find({ workspace: req.workspace._id }).populate('expense budget vendor').sort({ paymentDate: -1 });
    res.json({ success: true, payments, data: payments });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
