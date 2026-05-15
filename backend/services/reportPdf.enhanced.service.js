/**
 * reportPdf.service.js - Generate PDF Reports using PDFKit
 */

const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');

/**
 * Format date to Indian locale
 */
const formatDate = (date) => {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
};

/**
 * Format time
 */
const formatTime = (date) => {
  if (!date) return '-';
  return new Date(date).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * Generate Tasks PDF Report
 */
const generateTasksPDF = (tasks, metadata = {}) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        margin: 40,
        size: 'A4',
        layout: 'landscape'
      });

      const buffers = [];
      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      // ========== HEADER SECTION ==========
      doc.fontSize(18).font('Helvetica-Bold')
        .fillColor('#D32F2F')
        .text('ONEPWS MARKETING SYSTEM', 40, 30, { align: 'center' });

      doc.fontSize(12).font('Helvetica')
        .fillColor('#666666')
        .text('Tasks Report', 40, 55, { align: 'center' });

      doc.fontSize(9)
        .text(`Generated: ${new Date().toLocaleString('en-IN')}`, 40, 72, { align: 'center' });

      if (metadata.generatedBy) {
        doc.text(`By: ${metadata.generatedBy}`, 40, 85, { align: 'center' });
      }

      // Horizontal line
      doc.moveTo(40, 100).lineTo(760, 100)
        .strokeColor('#EEEEEE')
        .stroke();

      // ========== SUMMARY STATS ==========
      let currentY = 115;
      const stats = [
        {
          label: 'Total Tasks',
          value: metadata.filterSummary?.totalTasks || tasks.length
        },
        {
          label: 'Overdue',
          value: metadata.filterSummary?.overdueTasks || 0
        },
        {
          label: 'Completed',
          value: metadata.filterSummary?.completedTasks || 0
        },
        {
          label: 'In Progress',
          value: tasks.filter(t => t.status === 'in_process').length
        }
      ];

      const boxWidth = 165;
      stats.forEach((stat, i) => {
        const x = 40 + (i * (boxWidth + 8));
        
        // Box
        doc.rect(x, currentY, boxWidth, 45)
          .fillColor('#F5F5F5')
          .fill()
          .strokeColor('#E0E0E0')
          .stroke();

        // Value
        doc.fillColor('#D32F2F')
          .fontSize(20).font('Helvetica-Bold')
          .text(String(stat.value), x + 10, currentY + 8);

        // Label
        doc.fillColor('#666666')
          .fontSize(9).font('Helvetica')
          .text(stat.label, x + 10, currentY + 30, { width: boxWidth - 20 });
      });

      currentY += 60;

      // ========== TABLE HEADERS ==========
      const headers = [
        'Task No.', 'Title', 'Project', 'Stage', 'Priority', 'Assigned To', 'Due Date', 'Status'
      ];
      const colWidths = [70, 160, 100, 80, 65, 110, 75, 80];
      const startX = 40;

      let x = startX;
      headers.forEach((header, i) => {
        doc.rect(x, currentY, colWidths[i], 22)
          .fillColor('#D32F2F')
          .fill();

        doc.fillColor('#FFFFFF')
          .fontSize(9).font('Helvetica-Bold')
          .text(header, x + 5, currentY + 7, {
            width: colWidths[i] - 10,
            align: 'left'
          });

        x += colWidths[i];
      });

      currentY += 22;

      // ========== TABLE DATA ROWS ==========
      const rowHeight = 20;

      tasks.forEach((task, rowIdx) => {
        // Page break if needed
        if (currentY > 500) {
          doc.addPage();
          currentY = 40;

          // Repeat header on new page
          x = startX;
          headers.forEach((header, i) => {
            doc.rect(x, currentY, colWidths[i], 22)
              .fillColor('#D32F2F')
              .fill();

            doc.fillColor('#FFFFFF')
              .fontSize(9).font('Helvetica-Bold')
              .text(header, x + 5, currentY + 7, {
                width: colWidths[i] - 10,
                align: 'left'
              });

            x += colWidths[i];
          });

          currentY += 22;
        }

        // Row background (alternate)
        const bgColor = rowIdx % 2 === 0 ? '#FFFFFF' : '#FAFAFA';
        
        const rowData = [
          task.taskNumber || '-',
          (task.title || '-').substring(0, 35),
          task.project?.title?.substring(0, 18) || '-',
          task.stage?.name || '-',
          task.priority?.toUpperCase() || '-',
          task.assignedTo?.map(u => u.name).join(', ').substring(0, 25) || 'Unassigned',
          formatDate(task.dueDate),
          task.status?.toUpperCase() || '-'
        ];

        x = startX;
        rowData.forEach((cellData, colIdx) => {
          // Cell background
          doc.rect(x, currentY, colWidths[colIdx], rowHeight)
            .fillColor(bgColor)
            .fill();

          // Cell border
          doc.rect(x, currentY, colWidths[colIdx], rowHeight)
            .strokeColor('#E0E0E0')
            .stroke();

          // Cell text with color coding
          let textColor = '#333333';

          // Priority color
          if (colIdx === 4) {
            const priorityColors = {
              'LOW': '#4CAF50',
              'MEDIUM': '#FF9800',
              'HIGH': '#FF5722',
              'URGENT': '#F44336'
            };
            textColor = priorityColors[String(cellData).toUpperCase()] || '#333333';
          }

          // Overdue color
          if (task.dueDate && new Date(task.dueDate) < new Date()) {
            textColor = '#F44336';
          }

          doc.fillColor(textColor)
            .fontSize(8).font('Helvetica')
            .text(String(cellData || '-'), x + 5, currentY + 6, {
              width: colWidths[colIdx] - 10,
              align: 'left'
            });

          x += colWidths[colIdx];
        });

        currentY += rowHeight;
      });

      // ========== FOOTER ==========
      const pages = doc.bufferedPageRange();
      for (let i = 0; i < pages.count; i++) {
        doc.switchToPage(pages.start + i);
        doc.fontSize(8).fillColor('#AAAAAA')
          .text(
            `ONEPWS Private Limited | Confidential | Page ${i + 1} of ${pages.count}`,
            40,
            760,
            { align: 'center' }
          );
      }

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};

module.exports = {
  generateTasksPDF
};
