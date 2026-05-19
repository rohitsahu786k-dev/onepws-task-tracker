# TODO — #10 RBAC “as per spec” (SLA + Budget workspace scoping)

## Step 1 — SLA route RBAC hardening
- Edit `backend/routes/sla.routes.js`
- Add:
  - `protect`
  - `verifyWorkspaceAccess`
  - `checkModuleEnabled('sla')`
- Add per-endpoint:
  - `checkPermission('sla', 'view')` for GET `/`
  - `checkPermission('sla', 'configure')` for POST `/` + PUT `/:id`
  - `checkPermission('sla', 'reset_t0')` for PATCH `/:id/reset-t0`
  - `checkPermission('sla', 'configure')` for DELETE `/:id` (if delete maps to configure in this codebase)

## Step 2 — SLA controller workspace scoping
- Edit `backend/controllers/sla.controller.js`
- Remove any query-based workspace fallback (`req.params.wid || req.query.workspace`)
- Force all reads/writes to:
  - `workspace: req.workspace._id`
- Use workspace from middleware:
  - create: `workspace: req.workspace._id`

## Step 3 — Budget route RBAC hardening
- Edit `backend/routes/budget.routes.js`
- Add:
  - `protect`
  - `verifyWorkspaceAccess`
  - `checkModuleEnabled('budget')`
- Add per-endpoint:
  - `checkPermission('budget', 'view')` for GET `/`
  - `checkPermission('budget', 'create')` for POST `/`
  - `checkPermission('budget', 'update')` for PUT `/:id`
  - `checkPermission('budget', 'delete')` for DELETE `/:id`

## Step 4 — Budget controller workspace scoping
- Edit `backend/controllers/budget.controller.js`
- Force all reads/writes to:
  - `workspace: req.workspace._id`
- create: set `createdBy` and `workspace: req.workspace._id`
- getById/update/remove: query with `{ _id: req.params.id, workspace: req.workspace._id }`
- getAll: `Budget.find({ workspace: req.workspace._id })`

## Step 5 — Smoke test checklist (manual)
- Negative tests:
  - module disabled => 403 MODULE_DISABLED
  - missing permission => 403 PERMISSION_DENIED
  - cross-workspace access => 404/403 (never returns other workspace docs)
- Positive tests:
  - admin/manager/member flows for SLA and Budget endpoints
- Verify ActivityLog is emitted for permission/module changes (only if your current middleware already logs it).
