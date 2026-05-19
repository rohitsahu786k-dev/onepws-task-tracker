# 🔗 ROUTES INTEGRATION GUIDE

**How to wire up all the new endpoints in your Express routes**

---

## 📁 File Location: `backend/routes/`

Create or update the following route files:

---

## 1️⃣ TASK ROUTES

**File:** `backend/routes/task.routes.js`

```javascript
const express = require('express');
const router = express.Router();
const { 
  createTask, 
  getAllTasks, 
  updateTask, 
  getTaskById, 
  deleteTask 
} = require('../controllers/task.controller.enhanced');

const { verifyToken, verifyWorkspaceMember } = require('../middleware/auth');

// Apply middleware to all routes
router.use(verifyToken, verifyWorkspaceMember);

// ✅ NEW: Create task
router.post('/:wid/tasks', createTask);

// ✅ UPDATED: Get all tasks with filters
router.get('/:wid/tasks', getAllTasks);

// ✅ Get single task
router.get('/:wid/tasks/:id', getTaskById);

// ✅ UPDATED: Update task
router.put('/:wid/tasks/:id', updateTask);

// Delete task
router.delete('/:wid/tasks/:id', deleteTask);

module.exports = router;
```

---

## 2️⃣ REPORT ROUTES

**File:** `backend/routes/report.routes.js`

```javascript
const express = require('express');
const router = express.Router();
const {
  exportTasksExcel,
  exportTasksPDF,
  exportTasksCSV,
  emailReport
} = require('../controllers/report.controller.enhanced');

const { verifyToken, verifyWorkspaceMember } = require('../middleware/auth');

router.use(verifyToken, verifyWorkspaceMember);

// ✅ NEW: Export as Excel
router.post('/:wid/reports/export/tasks/excel', exportTasksExcel);

// ✅ NEW: Export as PDF
router.post('/:wid/reports/export/tasks/pdf', exportTasksPDF);

// ✅ NEW: Export as CSV
router.post('/:wid/reports/export/tasks/csv', exportTasksCSV);

// ✅ NEW: Email Report
router.post('/:wid/reports/email', emailReport);

module.exports = router;
```

---

## 3️⃣ TRACKER ROUTES

**File:** `backend/routes/tracker.routes.js`

```javascript
const express = require('express');
const router = express.Router();
const {
  createTrackerRow,
  updateTrackerRowField,
  getTrackerRows,
  deleteTrackerRow,
  bulkUpdateTrackerRows
} = require('../controllers/trackerRow.controller.enhanced');

const { verifyToken, verifyWorkspaceMember } = require('../middleware/auth');

router.use(verifyToken, verifyWorkspaceMember);

// ✅ NEW: Create tracker row
router.post('/:wid/tracker/rows', createTrackerRow);

// ✅ NEW: Get tracker rows with pagination
router.get('/:wid/tracker/rows', getTrackerRows);

// ✅ NEW: Update single field (inline editing)
router.patch('/:wid/tracker/rows/:rowId/field', updateTrackerRowField);

// ✅ NEW: Bulk update rows
router.post('/:wid/tracker/rows/bulk-update', bulkUpdateTrackerRows);

// ✅ NEW: Delete tracker row
router.delete('/:wid/tracker/rows/:rowId', deleteTrackerRow);

module.exports = router;
```

---

## 4️⃣ CALENDAR ROUTES

**File:** `backend/routes/calendar.routes.js`

```javascript
const express = require('express');
const router = express.Router();
const {
  createCalendarEvent,
  getCalendarEvents,
  updateCalendarEvent,
  deleteCalendarEvent
} = require('../controllers/calendar.controller.enhanced');

const { verifyToken, verifyWorkspaceMember } = require('../middleware/auth');

router.use(verifyToken, verifyWorkspaceMember);

// ✅ NEW: Create calendar event
router.post('/:wid/calendar/events', createCalendarEvent);

// ✅ NEW: Get calendar events with filters
router.get('/:wid/calendar/events', getCalendarEvents);

// ✅ NEW: Update calendar event
router.put('/:wid/calendar/events/:eventId', updateCalendarEvent);

// ✅ NEW: Delete calendar event
router.delete('/:wid/calendar/events/:eventId', deleteCalendarEvent);

module.exports = router;
```

---

## 5️⃣ MEDIA ROUTES

**File:** `backend/routes/media.routes.js`

```javascript
const express = require('express');
const router = express.Router();
const {
  uploadMediaFiles,
  getMediaFiles,
  getMediaFolders,
  serveMediaFile,
  getThumbnail,
  deleteMediaFile
} = require('../controllers/media.controller.enhanced');

const { verifyToken, verifyWorkspaceMember } = require('../middleware/auth');
const { uploadMedia } = require('../middleware/multer'); // multipart/form-data

router.use(verifyToken, verifyWorkspaceMember);

// ✅ NEW: Upload media files
router.post('/:wid/media/upload', uploadMedia.array('files', 10), uploadMediaFiles);

// ✅ NEW: Get media files list
router.get('/:wid/media', getMediaFiles);

// ✅ NEW: Get media folders
router.get('/:wid/media/folders', getMediaFolders);

// ✅ NEW: Serve media file (download/preview)
router.get('/:wid/media/:fileId/serve', serveMediaFile);

// ✅ NEW: Get thumbnail
router.get('/:wid/media/:fileId/thumbnail', getThumbnail);

// ✅ NEW: Delete media file
router.delete('/:wid/media/:fileId', deleteMediaFile);

module.exports = router;
```

---

## 🔗 MAIN APPLICATION SETUP

**File:** `backend/server.js` or `backend/app.js`

```javascript
const express = require('express');
const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ========== REGISTER ALL ROUTES ==========

const taskRoutes = require('./routes/task.routes');
const reportRoutes = require('./routes/report.routes');
const trackerRoutes = require('./routes/tracker.routes');
const calendarRoutes = require('./routes/calendar.routes');
const mediaRoutes = require('./routes/media.routes');

// Mount routes
app.use('/api/workspaces', taskRoutes);      // /api/workspaces/:wid/tasks
app.use('/api/workspaces', reportRoutes);    // /api/workspaces/:wid/reports
app.use('/api/workspaces', trackerRoutes);   // /api/workspaces/:wid/tracker
app.use('/api/workspaces', calendarRoutes);  // /api/workspaces/:wid/calendar
app.use('/api/workspaces', mediaRoutes);     // /api/workspaces/:wid/media

// OR combine into single router:
const router = express.Router();
router.use(taskRoutes);
router.use(reportRoutes);
router.use(trackerRoutes);
router.use(calendarRoutes);
router.use(mediaRoutes);

app.use('/api', router);

module.exports = app;
```

---

## 📋 COMPLETE ENDPOINT LIST

### ✅ ALL 15 ENDPOINTS

```
POST   /api/workspaces/:wid/tasks
GET    /api/workspaces/:wid/tasks?projectId=&page=1&limit=20
GET    /api/workspaces/:wid/tasks/:id
PUT    /api/workspaces/:wid/tasks/:id
DELETE /api/workspaces/:wid/tasks/:id

POST   /api/workspaces/:wid/reports/export/tasks/excel
POST   /api/workspaces/:wid/reports/export/tasks/pdf
POST   /api/workspaces/:wid/reports/export/tasks/csv
POST   /api/workspaces/:wid/reports/email

POST   /api/workspaces/:wid/tracker/rows
GET    /api/workspaces/:wid/tracker/rows?configId=&page=1
PATCH  /api/workspaces/:wid/tracker/rows/:rowId/field
POST   /api/workspaces/:wid/tracker/rows/bulk-update
DELETE /api/workspaces/:wid/tracker/rows/:rowId

POST   /api/workspaces/:wid/calendar/events
GET    /api/workspaces/:wid/calendar/events?startDate=&endDate=
PUT    /api/workspaces/:wid/calendar/events/:eventId
DELETE /api/workspaces/:wid/calendar/events/:eventId

POST   /api/workspaces/:wid/media/upload
GET    /api/workspaces/:wid/media?folderId=&type=&search=
GET    /api/workspaces/:wid/media/folders
GET    /api/workspaces/:wid/media/:fileId/serve
GET    /api/workspaces/:wid/media/:fileId/thumbnail
DELETE /api/workspaces/:wid/media/:fileId
```

---

## 🔑 MIDDLEWARE REQUIREMENTS

### Auth Middleware

**File:** `backend/middleware/auth.js`

```javascript
// These should be created/updated to work with enhanced controllers

const verifyToken = (req, res, next) => {
  // Verify JWT token
  // Set req.user = decoded token data
  next();
};

const verifyWorkspaceMember = (req, res, next) => {
  // Verify user is member of workspace
  // Set req.workspaceRole (admin/manager/member/viewer)
  // Set req.workspaceDepartment
  next();
};

module.exports = { verifyToken, verifyWorkspaceMember };
```

### File Upload Middleware

**File:** `backend/middleware/multer.js`

```javascript
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/media');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const uploadMedia = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (req, file, cb) => {
    const allowed = [
      'image/jpeg', 'image/png', 'image/webp', 'image/gif',
      'application/pdf', 'video/mp4', 'video/mpeg',
      'text/plain', 'text/csv'
    ];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});

module.exports = { uploadMedia };
```

---

## 📝 TESTING ENDPOINTS

### Using cURL

```bash
# Create Task
curl -X POST http://localhost:5000/api/workspaces/wid123/tasks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "title": "Test Task",
    "projectId": "proj123",
    "stageId": "stage123"
  }'

# Export Excel
curl -X POST http://localhost:5000/api/workspaces/wid123/reports/export/tasks/excel \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{}' \
  --output report.xlsx

# Create Tracker Row
curl -X POST http://localhost:5000/api/workspaces/wid123/tracker/rows \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "configId": "config123",
    "rowData": {}
  }'

# Upload Media
curl -X POST http://localhost:5000/api/workspaces/wid123/media/upload \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "files=@image.jpg" \
  -F "files=@document.pdf"
```

### Using Postman

1. Create collection: "ONEPWS API"
2. Add requests for each endpoint
3. Set Authorization header: `Bearer {{JWT_TOKEN}}`
4. Set environment variable: `BASE_URL=http://localhost:5000/api/workspaces`

---

## 🚀 DEPLOYMENT STEPS

1. **Copy enhanced controllers** to `backend/controllers/`
2. **Copy enhanced services** to `backend/services/`
3. **Create route files** using template above
4. **Register routes** in main server file
5. **Install dependencies** - npm install exceljs pdfkit sharp nodemailer
6. **Set environment variables** in .env
7. **Create MongoDB indexes** as shown in COMPLETE_BUTTON_IMPLEMENTATION_GUIDE.md
8. **Test all endpoints** with Postman or cURL
9. **Deploy to production**

---

## ✅ VERIFICATION CHECKLIST

- [ ] All enhanced controllers imported correctly
- [ ] All routes registered in server.js
- [ ] Middleware applied to all routes
- [ ] Database models have required fields
- [ ] MongoDB indexes created
- [ ] Environment variables configured
- [ ] File upload directory exists and is writable
- [ ] Email credentials configured
- [ ] Socket.IO setup (if using real-time updates)
- [ ] Test endpoints return expected responses
- [ ] Error handling works for all endpoints
- [ ] Access control enforced properly

---

**ROUTES INTEGRATION COMPLETE** ✅

All endpoints are ready to use!
