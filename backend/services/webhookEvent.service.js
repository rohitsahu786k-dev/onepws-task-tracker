const crypto = require('crypto');
const Webhook = require('../models/Webhook');
const WebhookDelivery = require('../models/WebhookDelivery');

/**
 * ONEPWS_WEBHOOK_EVENTS — all supported event names
 */
const WEBHOOK_EVENTS = [
  // Tasks
  'task.created', 'task.updated', 'task.assigned', 'task.stage_changed',
  'task.completed', 'task.overdue', 'task.commented',
  // Projects
  'project.created', 'project.updated', 'project.assigned', 'project.completed',
  // Approvals
  'approval.created', 'approval.approved', 'approval.rejected',
  'approval.changes_requested', 'approval.completed',
  // Budget
  'budget.created', 'budget.approved', 'budget.rejected', 'budget.threshold_reached',
  // Expense
  'expense.created', 'expense.approved', 'expense.rejected', 'expense.paid',
  // Meetings
  'meeting.scheduled', 'meeting.updated', 'meeting.cancelled',
  // MOM
  'mom.created', 'mom.signed', 'mom.action_point_created', 'mom.action_point_completed',
  // SLA
  'sla.breached', 'sla.deadline_approaching', 'sla.t0_confirmed',
  // Campaigns
  'campaign.created', 'campaign.started', 'campaign.completed',
  'content.created', 'content.approved', 'content.scheduled', 'content.published',
  // Vendors
  'vendor.created', 'vendor.approved', 'vendor.rejected',
  'vendor.blacklisted', 'vendor.contract_expiring',
  // Print Jobs
  'print_job.created', 'print_job.artwork_approved', 'print_job.sent_to_vendor',
  'print_job.proof_approved', 'print_job.dispatched', 'print_job.delivered',
  'print_job.completed', 'print_job.reprint_required',
  // Timesheets
  'timesheet.submitted', 'timesheet.approved', 'timesheet.rejected',
  // Wiki
  'wiki.article_published', 'wiki.article_needs_update',
  // Employees
  'employee.created', 'employee.role_changed', 'employee.deactivated',
  // System
  'webhook.test',
];

/**
 * Emit a webhook event: find subscribed active webhooks and deliver.
 */
async function emit({ workspace, event, data, metadata = {} }) {
  const webhooks = await Webhook.find({
    workspace,
    events: event,
    status: 'active',
  });

  if (!webhooks.length) return;

  const eventId = `evt_${Date.now()}_${crypto.randomBytes(6).toString('hex')}`;

  const payload = {
    id: eventId,
    event,
    workspaceId: workspace.toString(),
    timestamp: new Date().toISOString(),
    data,
    metadata: {
      source: 'onepws',
      environment: process.env.NODE_ENV || 'production',
      ...metadata,
    },
  };

  const { deliverWebhook } = require('./webhookDelivery.service');

  for (const webhook of webhooks) {
    const delivery = await WebhookDelivery.create({
      workspace,
      webhook: webhook._id,
      event,
      eventId,
      payload,
      url: webhook.url,
      status: 'pending',
      attempt: 1,
      maxAttempts: webhook.retryPolicy?.maxRetries || 3,
    });

    // Fire and forget — don't block the emitter
    deliverWebhook({ webhook, delivery }).catch((err) =>
      console.error(`[webhookEvent] Delivery failed for ${webhook.name}:`, err.message)
    );
  }
}

module.exports = { emit, WEBHOOK_EVENTS };
