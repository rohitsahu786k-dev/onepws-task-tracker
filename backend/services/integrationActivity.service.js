const IntegrationActivity = require('../models/IntegrationActivity');

/**
 * Log an integration activity event (API keys, webhooks, external API).
 */
async function log({ workspace, module, action, refModel, refId, description, metadata = {}, performedBy, ipAddress, userAgent }) {
  try {
    await IntegrationActivity.create({
      workspace,
      module,
      action,
      refModel,
      refId,
      description,
      metadata,
      performedBy,
      ipAddress,
      userAgent,
    });
  } catch (err) {
    console.error('[integrationActivity] Failed to log activity:', err.message);
  }
}

module.exports = { log };
