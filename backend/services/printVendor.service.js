const Vendor = require('../models/Vendor');

function findActiveVendor(workspace, vendorId) {
  return Vendor.findOne({ _id: vendorId, workspace, status: 'active', isDeleted: { $ne: true } });
}

module.exports = { findActiveVendor };
