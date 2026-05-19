# 🚀 COMPLETE BUTTON-BY-BUTTON IMPLEMENTATION GUIDE

**ONEPWS Marketing System - Full Stack Workflow Implementation**

---

## 📋 TABLE OF CONTENTS

1. [✅ Create Task Button](#1-create-task-button)
2. [📊 Export Reports (Excel/PDF/CSV/Email)](#2-export-reports)
3. [➕ New Tracker Row (Daily Tracker)](#3-new-tracker-row)
4. [📅 New Calendar Event](#4-new-calendar-event)
5. [👁️ Media Preview & Library](#5-media-preview--library)
6. [📁 File Organization](#6-file-organization)
7. [🔗 API Routes Summary](#7-api-routes-summary)
8. [⚙️ Installation & Setup](#8-installation--setup)

---

## 1️⃣ CREATE TASK BUTTON

### Frontend Flow - `CreateTaskModal.enhanced.jsx`

```javascript
Button Click
  ↓
Modal Opens (SlidePanel)
  ↓
Form Loads:
  • Fetch Projects ← GET /api/workspaces/:wid/projects
  • Fetch Members ← GET /api/workspaces/:wid/members
  • Fetch Stages ← GET /api/workspaces/:wid/projects/:projectId/stages (when project selected)
  • Fetch SLA Configs ← GET /api/workspaces/:wid/sla/config
  ↓
User Fills Form:
  - Title (required)
  - Description (Rich Text Editor)
  - Project (dropdown)
  - Stage (dropdown)
  - Assigned To (multi-select)
  - Priority (low/medium/high/urgent)
  - Due Date (date picker)
  - Estimated Hours (number)
  - SLA Type (dropdown)
  - Tags (comma-separated)
  - File Attachments (drag-drop or file picker)
  ↓
On Submit:
  1. Client-side validation (react-hook-form + zod)
  2. Upload temp attachments first
     POST /api/workspaces/:wid/tasks/attachments/temp
     Response: [{ tempFileId, fileName, fileUrl }]
  3. Create task with all data
     POST /api/workspaces/:wid/tasks
  4. On success:
     - Close modal
     - Refresh tasks list (React Query)
     - Show toast: "Task created successfully"
     - Socket emit: 'task_created' event (real-time)
```

### Backend - `task.controller.enhanced.js`

```
POST /api/workspaces/:wid/tasks

STEP 1: Validation
  ✓ title, projectId, stageId required
  ✓ Check file types & sizes

STEP 2: Generate Task Number
  → Query Counter collection for workspace
  → Generate: MKT-2026-0043 format
  → Increment counter

STEP 3: Create Task Document
  → Task.create({
      workspace, taskNumber, title, description,
      project, stage, assignedTo, priority, dueDate,
      estimatedHours, tags, createdBy, attachments
    })

STEP 4: Handle Attachments
  → Move temp files to permanent storage
  → Create TaskAttachment records
  → Link to task

STEP 5: Calculate SLA
  IF slaDeliverableType specified:
    → Fetch SLAConfig
    → Calculate phase deadlines
      • T0 = today
      • 1st draft deadline = T0 + config.firstDraftDays
      • Final delivery = T0 + (firstDraftDays + deliveryDays)
    → Create SLATracker record with phases

STEP 6: Create Calendar Event
  IF dueDate exists:
    → CalendarEvent.create({ type: 'Task', refId: task._id })

STEP 7: Send Notifications
  FOR EACH assigned user:
    → Notification.create({ type: 'task_assigned' })
    → Socket emit to user's room
    → Email send (if preference enabled)

STEP 8: Log Activity
  → ActivityLog.create({ action: 'task_created', ... })

STEP 9: Return Response
  → Populate task with all relations
  → Return 201 with task data
```

### Key Files Created/Modified:
- ✅ **Backend**: `task.controller.enhanced.js` - Complete CRUD + task number generation
- ✅ **Frontend**: `CreateTaskModal.enhanced.jsx` - Full form with validation

---

## 2️⃣ EXPORT REPORTS

### Frontend Flow

#### A) Export Excel Button

```javascript
Click "Export" Button
  ↓
Dropdown Menu Opens:
  • 📊 Excel (.xlsx)
  • 📄 PDF Report
  • 📋 CSV File
  • 📧 Email Report
  ↓
User Clicks "Excel (.xlsx)"
  ↓
Apply Current Filters:
  { projectId, stageId, priority, dateFrom, dateTo, assignedTo }
  ↓
API Call:
  POST /api/workspaces/:wid/reports/export/tasks/excel
  Body: { filters }
  ResponseType: 'blob'
  ↓
Browser Action:
  1. Create Blob from response
  2. Create Object URL
  3. Create <a> element with download attribute
  4. Trigger click() → Download starts
  5. Clean up: revokeObjectURL()
```

#### B) Export PDF Button

```javascript
Similar flow but:
  POST /api/workspaces/:wid/reports/export/tasks/pdf
  Response: PDF buffer
```

#### C) Export CSV Button

```javascript
Similar flow but:
  POST /api/workspaces/:wid/reports/export/tasks/csv
  Response: CSV with BOM (\uFEFF) for Excel encoding
```

#### D) Email Report Button

```javascript
Click "📧 Email Report"
  ↓
Email Modal Opens:
  - To: (email addresses, comma-separated)
  - Subject: (pre-filled with date)
  - Message: (optional personal note)
  ↓
User Submits
  ↓
API Call:
  POST /api/workspaces/:wid/reports/email
  Body: {
    reportType: 'tasks',
    filters: {...},
    to: 'email1@example.com, email2@example.com',
    subject: 'My Report',
    message: 'Optional message'
  }
  ↓
Backend:
  1. Validate email addresses (regex)
  2. Fetch task data
  3. Generate PDF in-memory (NOT saved to disk)
  4. Send email with PDF attachment via Nodemailer
  5. Return success response
```

### Backend - Report Controllers

#### File: `report.controller.enhanced.js`

```javascript
// 1. EXPORT EXCEL
POST /api/workspaces/:wid/reports/export/tasks/excel

STEP 1: Build MongoDB filter
STEP 2: Fetch tasks with populate()
STEP 3: Call reportExcelService.generateTasksExcel()
        → Uses ExcelJS library
        → Creates workbook with 2 sheets:
          • Sheet 1: All task data with headers
          • Sheet 2: Summary statistics
        → Returns Buffer
STEP 4: Set response headers
        Content-Type: application/vnd.ms-excel
        Content-Disposition: attachment; filename="..."
STEP 5: Send buffer as response

// 2. EXPORT PDF
POST /api/workspaces/:wid/reports/export/tasks/pdf

STEP 1-2: Same as Excel
STEP 3: Call reportPdfService.generateTasksPDF()
        → Uses PDFKit library
        → Creates formatted PDF with:
          • Header (company logo, title, date)
          • Summary stats boxes
          • Table with task data
          • Color-coded by priority
          • Page footers with pagination
        → Returns Buffer
STEP 4-5: Same response headers

// 3. EXPORT CSV
POST /api/workspaces/:wid/reports/export/tasks/csv

STEP 1-2: Same as Excel
STEP 3: Call reportCsvService.generateTasksCSV()
        → Escapes commas/quotes in values
        → Returns CSV string
STEP 4: Set header: Content-Type: text/csv
STEP 5: Send with BOM character (\uFEFF)

// 4. EMAIL REPORT
POST /api/workspaces/:wid/reports/email

STEP 1: Validate email addresses (multiple recipients)
STEP 2: Fetch task data
STEP 3: Generate PDF buffer in-memory
STEP 4: Call reportEmailService.sendReportEmail()
        → Uses Nodemailer transporter
        → Builds HTML email template
        → Attaches PDF file
        → Sends to recipients
STEP 5: Return success message
```

### Service Files - Report Generation

#### File: `reportPdf.enhanced.service.js` (PDFKit)

```javascript
generateTasksPDF(tasks, metadata) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      margin: 40,
      size: 'A4',
      layout: 'landscape' // For wide tables
    });

    // 1. HEADER
    //    - Company logo/name
    //    - Report title
    //    - Generation date
    //    - Generator name (if provided)

    // 2. SUMMARY STATISTICS
    //    - Total tasks count
    //    - Overdue count
    //    - Completed count
    //    - In-progress count

    // 3. TABLE HEADERS
    //    Columns: Task No. | Title | Project | Stage | Priority | Assigned To | Due Date | Status

    // 4. TABLE DATA ROWS
    //    FOR EACH task:
    //      - Draw row background (alternate colors)
    //      - Priority color-coding
    //      - Overdue highlighting
    //      - Word wrap for long text

    // 5. PAGE BREAKS
    //    If currentY > 500px, add new page
    //    Repeat headers on new pages

    // 6. FOOTER
    //    - ONEPWS branding
    //    - Page numbers
    //    - "Confidential" stamp

    // 7. RETURN BUFFER
    doc.end();
  });
}
```

#### File: `reportCsv.enhanced.service.js`

```javascript
generateTasksCSV(tasks) {
  // CSV Format:
  // Line 1: Headers (Task No., Title, Project, Stage, Priority, ...)
  // Lines 2+: Data rows
  //
  // Escape rules:
  // - If value contains comma or quote → wrap in quotes
  // - Replace internal quotes with ""
  //
  // Example:
  // Task No.,Title,Project,Stage,Priority,Assigned To,Due Date
  // MKT-2026-0001,"Task with, comma",Project A,Design,High,John Doe,2026-05-20
}
```

#### File: `reportEmail.enhanced.service.js` (Nodemailer)

```javascript
sendReportEmail(options) {
  // Email Configuration:
  // host: process.env.EMAIL_HOST (smtp.gmail.com)
  // port: process.env.EMAIL_PORT (587)
  // auth: { user, pass }
  //
  // Email Parts:
  // 1. From: "ONEPWS <noreply@onepws.com>"
  // 2. To: array of recipients
  // 3. Subject: custom subject
  // 4. HTML Body:
  //    - Styled template with brand colors
  //    - Report summary section
  //    - Personal message (if provided)
  //    - Button to access full system
  // 5. Attachments:
  //    - PDF file buffer (not saved to disk)
  //
  // Send via transporter.sendMail()
}
```

### Key Files Created:
- ✅ **Backend**: `report.controller.enhanced.js` - All export endpoints
- ✅ **Services**: 
  - `reportPdf.enhanced.service.js` - PDF generation with PDFKit
  - `reportCsv.enhanced.service.js` - CSV formatting
  - `reportEmail.enhanced.service.js` - Email sending with Nodemailer
- ✅ **Frontend**: `ExportButton.jsx` - Complete export UI with dropdown menu

---

## 3️⃣ NEW TRACKER ROW

### Frontend Flow - `TrackerGrid.enhanced.jsx` (AG Grid)

```javascript
Button Click: "+ New Row"
  ↓
Client-Side (Optimistic Update):
  1. Generate temp ID: `temp_${Date.now()}`
  2. Create empty row object with current rowNumber + 1
  3. Add to rows array immediately
  ↓
API Call (Async):
  POST /api/workspaces/:wid/tracker/rows
  Body: {
    configId: "config_id",
    rowData: {} // empty initially
  }
  ↓
On Success:
  1. Replace temp row with real row (with ID from server)
  2. Grid refreshes
  3. Focus first editable cell
  4. Start editing mode automatically
  ↓
On Error:
  1. Remove temp row
  2. Show error toast

User Types in Cells (Inline Editing):
  ↓
AG Grid Cell Editor:
  - Date: <input type="date">
  - Text: <input type="text">
  - Number: <input type="number">
  - Custom: SelectCellEditor
  ↓
On Cell Value Change (Debounced 300ms):
  API Call:
    PATCH /api/workspaces/:wid/tracker/rows/:rowId/field
    Body: {
      fieldKey: "actual_closing_date",
      value: "2026-05-15"
    }
  ↓
Backend Recalculates:
    1. Update field value
    2. Recalculate dependent fields:
       - delay_in_days = actualClosing - targetDue
       - delay_status = "On Time" / "Delayed (X days)"
    3. Return updated row
  ↓
Grid Updates:
    - Calculated columns refresh
    - Status colors update
    - No page reload needed
```

### Backend - `trackerRow.controller.enhanced.js`

```
POST /api/workspaces/:wid/tracker/rows

STEP 1: Validate config exists
STEP 2: Generate row number (auto-increment per configId)
STEP 3: Call trackerService.calculateAutoFields()
        Generates:
        - task_number: MKT-2026-{rowNumber}
        - target_due_date: receipt_date + working days (holidays excluded)
        - delay_in_days: actual_closing - target_due (working days)
        - delay_status: "On Time" / "Delayed (3 days)" / "Early (1 day)"
STEP 4: Create TrackerRow document
STEP 5: Create calendar event IF dueDate exists
STEP 6: Log activity
STEP 7: Return created row with calculated fields

PATCH /api/workspaces/:wid/tracker/rows/:rowId/field

STEP 1: Fetch row
STEP 2: Update single field: rowData[fieldKey] = value
STEP 3: Recalculate all auto-fields
        (auto-calculated fields re-run)
STEP 4: Save and return updated row
STEP 5: Grid receives new data and refreshes
```

### AG Grid Configuration

```javascript
columnDefs = [
  { field: 'rowNumber', headerName: 'S.No', editable: false },
  { field: 'rowData.task_number', headerName: 'Task No.', editable: false },
  { field: 'rowData.task_receipt_date', headerName: 'Receipt Date', cellEditor: DateEditor },
  { field: 'rowData.task_provided_by', headerName: 'Provided By', cellEditor: TextEditor },
  { field: 'calculatedData.my_target_due_date', headerName: 'Target Due Date', editable: false },
  { field: 'rowData.actual_closing_date', headerName: 'Actual Close', cellEditor: DateEditor },
  { field: 'calculatedData.delay_in_days', headerName: 'Delay (Days)', editable: false },
  { field: 'calculatedData.delay_status', headerName: 'Status', cellRenderer: StatusRenderer }
];

defaultColDef = {
  resizable: true,
  sortable: true,
  filter: true,
  editable: true
};

config = {
  pagination: true,
  paginationPageSize: 50,
  stopEditingWhenGridLosesFocus: true,
  enableCellChangeFlash: true,
  undoRedoCellEditing: true
};
```

### Key Files Created:
- ✅ **Backend**: `trackerRow.controller.enhanced.js` - Row creation and field updates
- ✅ **Frontend**: `TrackerGrid.enhanced.jsx` - AG Grid with inline editing

---

## 4️⃣ NEW CALENDAR EVENT

### Frontend Flow - `CreateEventModal.enhanced.jsx`

```javascript
Button Click: "New Event" OR Date Click on Calendar
  ↓
Modal Opens with Pre-filled Date:
  IF dateClick provided:
    startDate = dateClick.date
    allDay = dateClick.allDay
  ELSE:
    startDate = today
  ↓
Form Loads:
  • Fetch workspace members
  • Fetch tasks (for linking)
  ↓
User Fills Form:
  - Title (required)
  - Event Type: Custom/Task/Meeting/Reminder/MOM/Budget
  - Start Date + Time
  - End Date + Time
  - All Day toggle
  - Description
  - Attendees (multi-select)
  - Color (6 color picker)
  - Reminder: None/15min/30min/1hr/1day/2days
  - Recurrence: None/Daily/Weekly/Monthly
  - Link to Task (if type = Task)
  ↓
On Submit:
  POST /api/workspaces/:wid/calendar/events
  Body: {
    title, type, startDate, endDate, allDay,
    description, attendees, color, reminderMinutes,
    refId, refModel, isRecurring, recurrenceRule
  }
  ↓
On Success:
  1. Add event to FullCalendar immediately (no page refresh)
  2. Close modal
  3. Show toast
```

### Backend - `calendar.controller.enhanced.js`

```
POST /api/workspaces/:wid/calendar/events

STEP 1: Validation
  ✓ title and startDate required
  ✓ endDate > startDate

STEP 2: Parse dates
  → Convert startDate and endDate strings to Date objects
  → Handle timezone if needed

STEP 3: Create main CalendarEvent
  → CalendarEvent.create({
      workspace, title, type, startDate, endDate,
      allDay, description, attendees, color,
      createdBy, refId, refModel, isRecurring, recurrenceRule
    })

STEP 4: If recurring event:
  → Call createRecurringEvents(event, recurrenceRule)
  → Generate next 12 instances:
    FOR daily:   current + 1 day
    FOR weekly:  current + 7 days
    FOR monthly: current + 1 month
  → Create CalendarEvent for each with parentEventId

STEP 5: Create reminder if specified:
  → Calculate reminderTime = startDate - reminderMinutes
  → Reminder.create({
      event, reminderTime, type: 'calendar_event',
      status: 'pending', recipients: attendees
    })
  → Cron job will trigger email/notification at reminderTime

STEP 6: Send notifications to attendees:
  FOR EACH attendee:
    → Notification.create({ type: 'calendar_event_created' })
    → Socket emit to user
    → Optional: Email invitation

STEP 7: Activity log
STEP 8: Return populated event

GET /api/workspaces/:wid/calendar/events
  → Query with date range filter
  → Return array of events

PUT /api/workspaces/:wid/calendar/events/:eventId
  → Update event properties
  → If recurring parent changes, update all instances?

DELETE /api/workspaces/:wid/calendar/events/:eventId
  → Delete single event
  → If deleteRecurring=true, delete all instances
  → Delete associated reminders
```

### FullCalendar Integration

```javascript
<FullCalendar
  plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
  initialView="dayGridMonth"
  events={calendarEvents}
  
  // Click on date to create event
  dateClick={(info) => handleNewEvent(info)}
  
  // Click on existing event to edit
  eventClick={(info) => handleEditEvent(info)}
  
  // Drag to create or reschedule
  selectable={true}
  select={(info) => handleNewEvent(info)}
  
  // Drag event to reschedule
  editable={true}
  eventDrop={(info) => handleEventReschedule(info)}
/>

// After creating event on backend:
const calendarApi = calendarRef.current.getApi();
calendarApi.addEvent({
  id: event._id,
  title: event.title,
  start: event.startDate,
  end: event.endDate,
  allDay: event.allDay,
  backgroundColor: event.color,
  extendedProps: { type, attendees }
});
```

### Key Files Created:
- ✅ **Backend**: `calendar.controller.enhanced.js` - Event creation with recurrence
- ✅ **Frontend**: `CreateEventModal.enhanced.jsx` - Complete event form

---

## 5️⃣ MEDIA PREVIEW & LIBRARY

### Frontend Flow - Media Library

```javascript
Page Load:
  ↓
Fetch Data:
  GET /api/workspaces/:wid/media/folders
  GET /api/workspaces/:wid/media?folderId=root&limit=30
  ↓
Display Grid:
  - Thumbnails or list view
  - Folder structure on left
  - Files on right
  ↓
User Actions:

A) Upload Files:
   Button: "Upload Files"
   → Drag-drop or file picker
   → FOR EACH file:
     STEP 1: Check size (max 50MB)
     STEP 2: Prepare FormData
     STEP 3: POST /api/workspaces/:wid/media/upload
             multipart/form-data
     STEP 4: Progress bar shows upload %
     STEP 5: On success: Add to grid
     STEP 6: Generate thumbnail for images

B) Preview File:
   Click on file → MediaPreview modal opens
   ↓
   RENDER BASED ON FILE TYPE:
   • Image (jpg/png/webp):
     <img src="/api/workspaces/:wid/media/:fileId/serve" />
   • PDF:
     <iframe src="/api/.../serve#toolbar=0" />
   • Video (mp4/mpeg):
     <video controls>
       <source src="/api/.../serve" type="video/mp4" />
     </video>
   • Other:
     Show file icon + info panel + download button
   ↓
   Right panel shows:
   - File name
   - Size
   - Upload date
   - Uploaded by
   - Download count
   - Tags
   - Description
   - Action buttons: Download, Copy Link, Delete

C) Download File:
   GET /api/workspaces/:wid/media/:fileId/serve
   ResponseType: blob
   → createObjectURL → download

D) Delete File:
   DELETE /api/workspaces/:wid/media/:fileId
   → Remove from grid

E) Search/Filter:
   GET /api/workspaces/:wid/media
   ?search=keyword
   ?type=image|document|video
   ?folderId=...
```

### Backend - `media.controller.enhanced.js`

```
POST /api/workspaces/:wid/media/upload

STEP 1: Validate files array not empty
STEP 2: Check allowed MIME types
STEP 3: FOR EACH file:
  a) Create MediaFile document
  b) IF image:
     → Use sharp library to generate thumbnail
     → Resize to 300x300px
     → Save as JPEG 80% quality
  c) Save metadata
  d) Log activity

GET /api/workspaces/:wid/media
?folderId=&type=&search=&page=1&limit=30

STEP 1: Build MongoDB filter
  IF folderId specified: filter.folder = folderId
  IF type specified: filter.mimeType/extension
  IF search: filter.originalName { $regex: search }
STEP 2: Apply access control
  IF role = member:
    Can see: public files + own files
STEP 3: Fetch paginated results
STEP 4: Return with pagination metadata

GET /api/workspaces/:wid/media/:fileId/serve

STEP 1: Fetch MediaFile
STEP 2: Check access permission
STEP 3: Log download in MediaAccessLog
STEP 4: Increment downloadCount
STEP 5: IF video file:
  → Support Range Requests (for streaming)
  → Partial content response (206)
STEP 6: Set response headers:
  Content-Type: application/pdf (etc.)
  Content-Disposition: inline; filename="..."
STEP 7: Stream file from disk

GET /api/workspaces/:wid/media/:fileId/thumbnail

STEP 1: Fetch MediaFile
STEP 2: IF thumbnail exists:
  → Set Cache-Control header (1 day)
  → Stream thumbnail file
STEP 3: ELSE:
  → Return placeholder image

DELETE /api/workspaces/:wid/media/:fileId

STEP 1: Fetch file
STEP 2: Delete from disk (file + thumbnail)
STEP 3: Delete MediaFile document
STEP 4: Log activity
```

### File Structure on Server

```
uploads/
├── media/
│   ├── task-doc-1234567890.pdf
│   ├── image-1234567890.jpg
│   ├── video-1234567890.mp4
│   └── ...
└── thumbnails/
    ├── thumb_image-1234567890.jpg
    └── ...
```

### Key Files Created:
- ✅ **Backend**: `media.controller.enhanced.js` - Upload, serve, delete
- ✅ **Frontend**: `MediaPreview.enhanced.jsx` - Preview modal with file viewer

---

## 6️⃣ FILE ORGANIZATION

### Complete Folder Structure

**Backend:**
```
backend/
├── controllers/
│   ├── task.controller.enhanced.js ✅
│   ├── report.controller.enhanced.js ✅
│   ├── trackerRow.controller.enhanced.js ✅
│   ├── calendar.controller.enhanced.js ✅
│   ├── media.controller.enhanced.js ✅
│   └── ...
├── services/
│   ├── reportPdf.enhanced.service.js ✅
│   ├── reportCsv.enhanced.service.js ✅
│   ├── reportEmail.enhanced.service.js ✅
│   ├── tracker.service.js (existing - use for calculations)
│   ├── calendar.service.js (existing)
│   └── ...
├── models/
│   ├── Task.js (existing - enhance if needed)
│   ├── CalendarEvent.js (existing)
│   ├── TrackerRow.js (existing)
│   ├── MediaFile.js (existing)
│   └── ...
├── routes/
│   └── (Update to use enhanced controllers)
└── uploads/
    ├── media/
    └── thumbnails/
```

**Frontend:**
```
frontend/src/components/
├── tasks/
│   └── CreateTaskModal.enhanced.jsx ✅
├── reports/
│   └── ExportButton.jsx ✅
├── tracker/
│   └── TrackerGrid.enhanced.jsx ✅
├── calendar/
│   └── CreateEventModal.enhanced.jsx ✅
├── media/
│   └── MediaPreview.enhanced.jsx ✅
└── common/
    └── ExportButton.jsx (moved from reports) ✅
```

---

## 7️⃣ API ROUTES SUMMARY

### Task Routes
```
POST   /api/workspaces/:wid/tasks
GET    /api/workspaces/:wid/tasks
GET    /api/workspaces/:wid/tasks/:id
PUT    /api/workspaces/:wid/tasks/:id
DELETE /api/workspaces/:wid/tasks/:id
```

### Report Routes
```
POST   /api/workspaces/:wid/reports/export/tasks/excel
POST   /api/workspaces/:wid/reports/export/tasks/pdf
POST   /api/workspaces/:wid/reports/export/tasks/csv
POST   /api/workspaces/:wid/reports/email
```

### Tracker Routes
```
POST   /api/workspaces/:wid/tracker/rows
GET    /api/workspaces/:wid/tracker/rows
PATCH  /api/workspaces/:wid/tracker/rows/:rowId/field
DELETE /api/workspaces/:wid/tracker/rows/:rowId
POST   /api/workspaces/:wid/tracker/rows/bulk-update
```

### Calendar Routes
```
POST   /api/workspaces/:wid/calendar/events
GET    /api/workspaces/:wid/calendar/events
PUT    /api/workspaces/:wid/calendar/events/:eventId
DELETE /api/workspaces/:wid/calendar/events/:eventId
```

### Media Routes
```
POST   /api/workspaces/:wid/media/upload
GET    /api/workspaces/:wid/media
GET    /api/workspaces/:wid/media/folders
GET    /api/workspaces/:wid/media/:fileId/serve
GET    /api/workspaces/:wid/media/:fileId/thumbnail
DELETE /api/workspaces/:wid/media/:fileId
```

---

## 8️⃣ INSTALLATION & SETUP

### Backend Dependencies

```bash
npm install exceljs  # Excel generation
npm install pdfkit   # PDF generation  
npm install sharp    # Image thumbnails
npm install nodemailer  # Email sending
npm install ag-grid-react  # Grid (if using AG Grid)
```

### Environment Variables (.env)

```env
# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password

# File Upload
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=52428800  # 50MB in bytes
ALLOWED_FILE_TYPES=image/jpeg,image/png,application/pdf,video/mp4

# Working Days (for SLA calculations)
WORKING_DAYS=1,2,3,4,5  # 0=Sunday, 1=Monday, etc.
HOLIDAYS=2026-01-26,2026-03-08  # Comma-separated dates
```

### Frontend Dependencies

```bash
npm install react-quill  # Rich text editor
npm install react-hook-form zod  # Form validation
npm install @fullcalendar/react  # Calendar
npm install ag-grid-react ag-grid-community  # Advanced table
npm install lucide-react  # Icons
npm install react-toastify  # Toast notifications
```

### Database Indexes

```javascript
// Counter collection (for task number generation)
db.counters.createIndex({ workspace: 1, name: 1, year: 1 }, { unique: true })

// Task indexes
db.tasks.createIndex({ workspace: 1, taskNumber: 1 }, { unique: true })
db.tasks.createIndex({ workspace: 1, project: 1 })
db.tasks.createIndex({ workspace: 1, stage: 1 })
db.tasks.createIndex({ workspace: 1, assignedTo: 1 })

// Tracker indexes
db.trackerrows.createIndex({ workspace: 1, configId: 1 })
db.trackerrows.createIndex({ workspace: 1, rowNumber: 1 })

// Calendar indexes
db.calendarevents.createIndex({ workspace: 1, startDate: 1 })

// Media indexes
db.mediafiles.createIndex({ workspace: 1, folder: 1 })
db.mediafiles.createIndex({ workspace: 1, originalName: 'text' })
```

### Testing Checklist

```
✅ Create Task Button:
  - [ ] Form validation works
  - [ ] File upload shows progress
  - [ ] Task number generates correctly
  - [ ] Notifications sent to assignees
  - [ ] Calendar event created

✅ Export Buttons:
  - [ ] Excel exports with formatting
  - [ ] PDF shows colored priority
  - [ ] CSV handles commas properly
  - [ ] Email sends with attachment
  - [ ] File downloads work

✅ Tracker Row:
  - [ ] New row adds to grid
  - [ ] Inline editing works
  - [ ] Auto-calculations update
  - [ ] Delay status colors change

✅ Calendar Event:
  - [ ] Event creates with recurrence
  - [ ] Attendees get notifications
  - [ ] Reminder triggers at correct time

✅ Media:
  - [ ] Upload shows progress
  - [ ] Thumbnails generate for images
  - [ ] PDF preview works
  - [ ] Video streaming supports seeking
```

---

## 🎯 QUICK START

1. **Copy all enhanced files** to your project
2. **Install dependencies** via npm
3. **Update routes** to use enhanced controllers
4. **Configure environment** variables
5. **Test each button** individually
6. **Enable Socket.IO** for real-time updates
7. **Set up email server** (Gmail or SendGrid)
8. **Deploy and celebrate** 🎉

---

## 📞 SUPPORT

For issues or questions about implementation:
- Check console for errors
- Verify API response structure
- Ensure all models exist with correct fields
- Check MongoDB indexes are created
- Verify environment variables are set

---

**Last Updated**: May 12, 2026
**Version**: 1.0 - Complete Implementation
