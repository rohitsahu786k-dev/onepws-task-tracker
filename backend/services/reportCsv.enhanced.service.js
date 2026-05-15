/**
 * reportCsv.service.js - Generate CSV Reports
 * Simple, client-friendly CSV format
 */

/**
 * Escape CSV cell values (handle commas, quotes, newlines)
 */
const escapeCSVCell = (value) => {
  if (value === null || value === undefined) return '';
  
  const str = String(value);
  
  // If contains comma, quote, or newline - wrap in quotes
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  
  return str;
};

/**
 * Format display value for CSV
 */
const formatValue = (value) => {
  if (value === null || value === undefined) return '';
  if (value instanceof Date) return value.toLocaleDateString('en-IN');
  if (Array.isArray(value)) return value.map(v => v.name || v.title || String(v)).join('; ');
  if (typeof value === 'object') return value.name || value.title || value.email || '';
  return String(value);
};

/**
 * Generate Tasks CSV
 */
const generateTasksCSV = (tasks) => {
  if (!tasks || tasks.length === 0) {
    return 'No data available';
  }

  // CSV Headers
  const headers = [
    'Task No.',
    'Title',
    'Project',
    'Stage',
    'Priority',
    'Assigned To',
    'Due Date',
    'Created By',
    'Created Date',
    'Est. Hours',
    'Status'
  ];

  // Data rows
  const rows = tasks.map(task => [
    task.taskNumber || '',
    task.title || '',
    task.project?.title || '',
    task.stage?.name || '',
    task.priority?.toUpperCase() || '',
    formatValue(task.assignedTo),
    task.dueDate ? new Date(task.dueDate).toLocaleDateString('en-IN') : '',
    task.createdBy?.name || '',
    task.createdAt ? new Date(task.createdAt).toLocaleDateString('en-IN') : '',
    task.estimatedHours || '',
    task.status?.toUpperCase() || ''
  ]);

  // Build CSV string
  const csvLines = [
    headers.map(h => escapeCSVCell(h)).join(','),
    ...rows.map(row => row.map(cell => escapeCSVCell(cell)).join(','))
  ];

  return csvLines.join('\n');
};

/**
 * Generate Tracker CSV
 */
const generateTrackerCSV = (trackerRows) => {
  if (!trackerRows || trackerRows.length === 0) {
    return 'No data available';
  }

  // Get all unique field keys
  const allKeys = new Set();
  trackerRows.forEach(row => {
    if (row.rowData) {
      Object.keys(row.rowData).forEach(key => allKeys.add(key));
    }
  });

  const headers = Array.from(allKeys).sort();

  // Data rows
  const rows = trackerRows.map(row => {
    return headers.map(header => {
      const value = row.rowData?.[header];
      return escapeCSVCell(formatValue(value));
    });
  });

  // Build CSV
  const csvLines = [
    headers.map(h => escapeCSVCell(h)).join(','),
    ...rows.map(row => row.join(','))
  ];

  return csvLines.join('\n');
};

module.exports = {
  generateTasksCSV,
  generateTrackerCSV,
  escapeCSVCell
};
