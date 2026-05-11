const fs = require('fs');
const path = require('path');

const modelsDir = path.join(__dirname, 'models');

const indexes = {
  'User': [
    \`schema.index({ googleId: 1 }, { sparse: true });\`,
    \`schema.index({ "workspaces.workspace": 1 });\`
  ],
  'Workspace': [
    \`schema.index({ slug: 1 }, { unique: true });\`,
    \`schema.index({ owner: 1 });\`
  ],
  'Department': [
    \`schema.index({ workspace: 1, code: 1 }, { unique: true });\`,
    \`schema.index({ workspace: 1, name: 1 });\`
  ],
  'Project': [
    \`schema.index({ workspace: 1, projectCode: 1 }, { unique: true });\`,
    \`schema.index({ workspace: 1, status: 1 });\`,
    \`schema.index({ workspace: 1, department: 1 });\`,
    \`schema.index({ workspace: 1, dueDate: 1 });\`
  ],
  'Task': [
    \`schema.index({ workspace: 1, taskNumber: 1 }, { unique: true });\`,
    \`schema.index({ workspace: 1, status: 1 });\`,
    \`schema.index({ workspace: 1, stage: 1 });\`,
    \`schema.index({ workspace: 1, assignedTo: 1 });\`,
    \`schema.index({ workspace: 1, dueDate: 1 });\`,
    \`schema.index({ workspace: 1, finalInputReceiptDate: 1 });\`,
    \`schema.index({ workspace: 1, deliverableType: 1 });\`,
    \`schema.index({ workspace: 1, createdAt: 1 });\`,
    \`schema.index({ title: 'text', description: 'text' });\`
  ],
  'TrackerRow': [
    \`schema.index({ workspace: 1, config: 1, rowNumber: 1 }, { unique: true });\`,
    \`schema.index({ workspace: 1, createdAt: 1 });\`,
    \`schema.index({ workspace: 1, status: 1 });\`
  ],
  'TrackerFieldConfig': [
    \`schema.index({ workspace: 1, name: 1 });\`
  ],
  'SLAConfig': [
    \`schema.index({ workspace: 1, deliverableType: 1 }, { unique: true });\`
  ],
  'SLATracker': [
    \`schema.index({ workspace: 1, task: 1 }, { unique: true });\`,
    \`schema.index({ workspace: 1, overallStatus: 1 });\`
  ],
  'IntakeForm': [
    \`schema.index({ workspace: 1, requestNumber: 1 }, { unique: true });\`,
    \`schema.index({ workspace: 1, status: 1 });\`,
    \`schema.index({ workspace: 1, requestedBy: 1 });\`
  ],
  'MOM': [
    \`schema.index({ workspace: 1, momNumber: 1 }, { unique: true });\`,
    \`schema.index({ workspace: 1, task: 1 });\`,
    \`schema.index({ workspace: 1, project: 1 });\`
  ],
  'Meeting': [
    \`schema.index({ workspace: 1, meetingNumber: 1 }, { unique: true });\`,
    \`schema.index({ workspace: 1, startDateTime: 1 });\`
  ],
  'CalendarEvent': [
    \`schema.index({ workspace: 1, startDate: 1 });\`,
    \`schema.index({ workspace: 1, endDate: 1 });\`,
    \`schema.index({ workspace: 1, eventType: 1 });\`,
    \`schema.index({ workspace: 1, assignedTo: 1 });\`
  ],
  'MediaFile': [
    \`schema.index({ workspace: 1, folder: 1 });\`,
    \`schema.index({ workspace: 1, fileCategory: 1 });\`,
    \`schema.index({ originalName: 'text' });\`,
    \`schema.index({ tags: 1 });\`
  ],
  'Budget': [
    \`schema.index({ workspace: 1, budgetNumber: 1 }, { unique: true });\`,
    \`schema.index({ workspace: 1, project: 1 });\`,
    \`schema.index({ workspace: 1, department: 1 });\`
  ],
  'Expense': [
    \`schema.index({ workspace: 1, expenseNumber: 1 }, { unique: true });\`,
    \`schema.index({ workspace: 1, budget: 1 });\`,
    \`schema.index({ workspace: 1, status: 1 });\`
  ],
  'Notification': [
    \`schema.index({ recipient: 1, isRead: 1 });\`,
    \`schema.index({ workspace: 1, createdAt: 1 });\`
  ],
  'ActivityLog': [
    \`schema.index({ workspace: 1, user: 1 });\`,
    \`schema.index({ workspace: 1, module: 1 });\`,
    \`schema.index({ workspace: 1, createdAt: 1 });\`
  ]
};

Object.keys(indexes).forEach(model => {
  const filePath = path.join(modelsDir, model + '.js');
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    const indexLines = indexes[model].join('\n');
    
    // Check if indexes are already added
    if (!content.includes('schema.index')) {
      content = content.replace('module.exports', indexLines + '\n\nmodule.exports');
      fs.writeFileSync(filePath, content, 'utf8');
      console.log('Added indexes to', model);
    }
  }
});
