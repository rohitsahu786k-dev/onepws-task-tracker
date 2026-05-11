require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');
const Workspace = require('../models/Workspace');
const TrackerFieldConfig = require('../models/TrackerFieldConfig');

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Seed Admin
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

    // Seed Default Workspace
    await Workspace.deleteOne({ slug: 'default' });
    const workspace = await Workspace.create({
      name: 'Default Workspace',
      slug: 'default',
      owner: admin._id,
      members: [{ user: admin._id, role: 'owner', isActive: true }],
      isActive: true
    });
    console.log(`✅ Default Workspace seeded: ${workspace.name}`);

    // Update Admin with Workspace
    admin.workspaces.push({ workspace: workspace._id, role: 'owner', isActive: true });
    admin.defaultWorkspace = workspace._id;
    await admin.save({ validateBeforeSave: false });

    // Seed Tracker Field Config
    await TrackerFieldConfig.deleteMany({ workspace: workspace._id, isDefault: true });
    
    const defaultFields = [
      {
        label: "S.No.",
        fieldKey: "serial_no",
        fieldType: "auto",
        isSystem: true,
        isEditable: false,
        autoFormula: { formulaType: "serial_number" }
      },
      {
        label: "Task Receipt Date",
        fieldKey: "task_receipt_date",
        fieldType: "date",
        isRequired: true
      },
      {
        label: "Task Number",
        fieldKey: "task_number",
        fieldType: "auto",
        isSystem: true,
        isEditable: false,
        autoFormula: { formulaType: "task_number" }
      },
      {
        label: "Revision Number",
        fieldKey: "revision_number",
        fieldType: "text",
        defaultValue: "R0"
      },
      {
        label: "Task Provided By",
        fieldKey: "task_provided_by",
        fieldType: "dropdown",
        dropdownOptions: [
          { label: "Sales", value: "sales" },
          { label: "Pre-Sales", value: "pre_sales" },
          { label: "CR", value: "cr" },
          { label: "CD", value: "cd" },
          { label: "Admin", value: "admin" },
          { label: "MOT", value: "mot" },
          { label: "Others", value: "others" }
        ]
      },
      {
        label: "Task Handled By",
        fieldKey: "task_handled_by",
        fieldType: "user"
      },
      {
        label: "Task Given By Department",
        fieldKey: "task_given_by_department",
        fieldType: "department"
      },
      {
        label: "Type Of Task",
        fieldKey: "type_of_task",
        fieldType: "dropdown",
        dropdownOptions: [
          { label: "Catalogue upto 20 pages", value: "cat_s" },
          { label: "Catalogue 20-40 pages", value: "cat_m" },
          { label: "Catalogue 40+ pages", value: "cat_l" },
          { label: "Brochure", value: "brochure" },
          { label: "Flyer", value: "flyer" },
          { label: "Social Media Post", value: "social" },
          { label: "PPT <20 pages", value: "ppt_s" },
          { label: "PPT >20 pages", value: "ppt_l" },
          { label: "Email Campaign", value: "email" },
          { label: "Website Update", value: "web" },
          { label: "Events", value: "events" }
        ]
      },
      {
        label: "Receipt Date From Final Inputs",
        fieldKey: "receipt_date_from_final_inputs",
        fieldType: "date",
        isRequired: true
      },
      {
        label: "My Target Due Date (+3 Days From Receipt Date)",
        fieldKey: "my_target_due_date",
        fieldType: "auto",
        isEditable: false,
        autoFormula: {
          formulaType: "date_plus_working_days",
          sourceField: "receipt_date_from_final_inputs",
          daysToAdd: 3,
          excludeWeekends: true,
          excludeHolidays: true
        }
      },
      {
        label: "Actual Closing Date",
        fieldKey: "actual_closing_date",
        fieldType: "date"
      },
      {
        label: "Delay In Task Closure",
        fieldKey: "delay_in_task_closure",
        fieldType: "auto",
        isEditable: false,
        autoFormula: {
          formulaType: "date_difference",
          sourceField: "actual_closing_date",
          targetField: "my_target_due_date"
        }
      },
      {
        label: "Delay/In Time",
        fieldKey: "delay_in_time",
        fieldType: "auto",
        isEditable: false,
        autoFormula: {
          formulaType: "delay_status"
        }
      },
      {
        label: "Type Of Product CD/CCR/MOT/FLOOR",
        fieldKey: "type_of_product",
        fieldType: "dropdown",
        dropdownOptions: [
          { label: "CD", value: "cd" },
          { label: "CCR", value: "ccr" },
          { label: "MOT", value: "mot" },
          { label: "FLOOR", value: "floor" }
        ]
      },
      {
        label: "Remark If Pending",
        fieldKey: "remark_if_pending",
        fieldType: "textarea"
      },
      {
        label: "Final Status",
        fieldKey: "final_status",
        fieldType: "dropdown",
        dropdownOptions: [
          { label: "Pending", value: "pending" },
          { label: "Submitted", value: "submitted" }
        ]
      }
    ];

    await TrackerFieldConfig.create({
      workspace: workspace._id,
      name: "Marketing Daily Task Tracker",
      description: "Default marketing tracker config",
      fields: defaultFields,
      isDefault: true,
      isActive: true,
      createdBy: admin._id
    });

    console.log(`✅ Default TrackerFieldConfig seeded`);

    // Seed Role Permissions
    const PermissionConfig = require('../models/PermissionConfig');
    await PermissionConfig.deleteMany({ workspace: workspace._id });
    
    const DEFAULT_ROLE_PERMISSIONS = {
      admin: [
        { module: "workspace", actions: ["view", "update"] },
        { module: "departments", actions: ["view", "create", "update", "delete"] },
        { module: "users", actions: ["view", "invite", "update_role", "remove"] },
        { module: "projects", actions: ["view", "create", "update", "delete", "archive"] },
        { module: "tasks", actions: ["view", "create", "update", "delete", "assign", "comment", "change_stage"] },
        { module: "tracker", actions: ["view", "create_row", "update_any_row", "delete_row", "configure_fields", "bulk_import", "bulk_export", "lock_row", "unlock_row"] },
        { module: "calendar", actions: ["view", "create", "update", "delete", "manage_holidays"] },
        { module: "media", actions: ["view", "upload", "download", "delete", "manage_folders"] },
        { module: "mom", actions: ["view", "create", "update", "delete", "send_for_signature", "generate_pdf"] },
        { module: "meetings", actions: ["view", "create", "update", "delete"] },
        { module: "sla", actions: ["view", "configure", "reset_t0", "escalate"] },
        { module: "intake", actions: ["view", "review", "approve", "reject"] },
        { module: "budget", actions: ["view", "create", "update", "delete", "approve"] },
        { module: "expenses", actions: ["view", "create", "update", "delete", "approve"] },
        { module: "reports", actions: ["view", "export"] },
        { module: "notes", actions: ["view", "create", "update", "delete"] },
        { module: "wiki", actions: ["view", "create", "update", "delete"] },
        { module: "vendors", actions: ["view", "create", "update", "delete"] },
        { module: "settings", actions: ["view", "update"] },
        { module: "activity_logs", actions: ["view", "export"] },
        { module: "backup", actions: ["view", "create", "download"] }
      ],
      manager: [
        { module: "departments", actions: ["view"] },
        { module: "users", actions: ["view"] },
        { module: "projects", actions: ["view", "create", "update"] },
        { module: "tasks", actions: ["view", "create", "update", "assign", "comment", "change_stage"] },
        { module: "tracker", actions: ["view", "create_row", "update_department_row", "bulk_export"] },
        { module: "calendar", actions: ["view", "create", "update"] },
        { module: "media", actions: ["view", "upload", "download"] },
        { module: "mom", actions: ["view", "create", "update", "sign", "generate_pdf"] },
        { module: "meetings", actions: ["view", "create", "update"] },
        { module: "sla", actions: ["view"] },
        { module: "intake", actions: ["view", "review"] },
        { module: "budget", actions: ["view"] },
        { module: "expenses", actions: ["view", "create"] },
        { module: "reports", actions: ["view", "export_department"] },
        { module: "notes", actions: ["view", "create", "update"] },
        { module: "wiki", actions: ["view", "create", "update"] },
        { module: "vendors", actions: ["view"] }
      ],
      member: [
        { module: "projects", actions: ["view"] },
        { module: "tasks", actions: ["view", "create", "update_own", "update_assigned", "comment", "change_own_stage"] },
        { module: "tracker", actions: ["view", "create_row", "update_own_row"] },
        { module: "calendar", actions: ["view", "create_own", "update_own"] },
        { module: "media", actions: ["view", "upload", "download"] },
        { module: "mom", actions: ["view", "sign"] },
        { module: "meetings", actions: ["view", "create_own"] },
        { module: "sla", actions: ["view_own"] },
        { module: "intake", actions: ["view_own", "create"] },
        { module: "expenses", actions: ["view_own", "create"] },
        { module: "reports", actions: ["view_own"] },
        { module: "notes", actions: ["view", "create", "update_own", "delete_own"] },
        { module: "wiki", actions: ["view"] }
      ],
      viewer: [
        { module: "projects", actions: ["view"] },
        { module: "tasks", actions: ["view"] },
        { module: "tracker", actions: ["view"] },
        { module: "calendar", actions: ["view"] },
        { module: "media", actions: ["view", "download"] },
        { module: "mom", actions: ["view"] },
        { module: "meetings", actions: ["view"] },
        { module: "sla", actions: ["view"] },
        { module: "intake", actions: ["view_own"] },
        { module: "budget", actions: ["view"] },
        { module: "expenses", actions: ["view"] },
        { module: "reports", actions: ["view"] },
        { module: "notes", actions: ["view"] },
        { module: "wiki", actions: ["view"] }
      ]
    };

    for (const role of Object.keys(DEFAULT_ROLE_PERMISSIONS)) {
      await PermissionConfig.create({
        workspace: workspace._id,
        role: role,
        permissions: DEFAULT_ROLE_PERMISSIONS[role],
        isSystemDefault: true
      });
    }

    console.log(`✅ Default Role Permissions seeded`);

    process.exit(0);
  } catch (err) {
    console.error('❌ Seed error:', err);
    process.exit(1);
  }
};

seed();
