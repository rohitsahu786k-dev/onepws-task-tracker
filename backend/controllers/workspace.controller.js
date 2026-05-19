const dayjs = require('dayjs');
const crypto = require('crypto');
const Workspace = require('../models/Workspace');
const Department = require('../models/Department');
const WorkspaceInvite = require('../models/WorkspaceInvite');
const User = require('../models/User');
const Session = require('../models/Session');
const ActivityLog = require('../models/ActivityLog');
const asyncHandler = require('../utils/asyncHandler');
const tokenService = require('../services/token.service');
const authService = require('../services/auth.service');
const workspaceService = require('../services/workspace.service');
const workspaceOnboardingService = require('../services/workspaceOnboarding.service');
const activityLogService = require('../services/activityLog.service');
const { validatePassword } = require('../services/password.service');

const getId = (req) => req.params.wid || req.params.id || req.params.workspaceId;
const ownerRoles = ['owner', 'admin', 'super_admin'];

function isWorkspaceAdmin(req) {
  return req.user?.globalRole === 'super_admin' || ownerRoles.includes(req.workspaceRole);
}

async function findWorkspaceForUser(req, id = getId(req)) {
  const workspace = await Workspace.findOne({ _id: id, isDeleted: { $ne: true } });
  if (!workspace) return null;
  if (req.user.globalRole === 'super_admin') return workspace;
  const member = workspace.members.find((item) => item.user?.toString() === req.user._id.toString() && item.isActive !== false);
  return member ? workspace : null;
}

const getMyWorkspaces = asyncHandler(async (req, res) => {
  if (req.user.globalRole === 'super_admin') {
    const workspaces = await Workspace.find({ isDeleted: { $ne: true } }).sort({ createdAt: -1 });
    return res.json({ success: true, data: workspaces, workspaces });
  }

  const ids = (req.user.workspaces || []).filter((item) => item.isActive !== false).map((item) => item.workspace);
  const workspaces = await Workspace.find({ _id: { $in: ids }, isDeleted: { $ne: true }, isActive: true }).populate('members.department');
  const data = workspaces.map((workspace) => {
    const membership = req.user.workspaces.find((item) => item.workspace?.toString() === workspace._id.toString());
    return {
      ...workspace.toObject(),
      role: membership?.role || 'member',
      department: membership?.department || null,
      allowedModules: workspaceService.getDefaultAllowedModules()
        ? { ...workspaceService.getDefaultAllowedModules(), ...(workspace.allowedModules?.toObject?.() || workspace.allowedModules || {}) }
        : workspace.allowedModules
    };
  });
  res.json({ success: true, data, workspaces: data });
});

const getAll = getMyWorkspaces;

const create = asyncHandler(async (req, res) => {
  const { name, companyName, description, timezone, currency, allowedModules = {} } = req.body;
  const slug = await workspaceService.generateUniqueSlug(name);
  const mergedModules = { ...workspaceService.getDefaultAllowedModules(), ...allowedModules };

  const workspace = await Workspace.create({
    name,
    slug,
    companyName,
    description,
    owner: req.user._id,
    allowedModules: mergedModules,
    settings: { timezone: timezone || 'Asia/Kolkata', currency: currency || 'INR' },
    storage: { uploadPath: `/uploads/workspaces/${slug}` },
    members: [{ user: req.user._id, role: 'owner', isActive: true, addedAt: new Date(), addedBy: req.user._id }],
    createdBy: req.user._id
  });

  await User.findByIdAndUpdate(req.user._id, {
    $addToSet: {
      workspaces: {
        workspace: workspace._id,
        role: 'owner',
        isActive: true,
        joinedAt: new Date(),
        addedBy: req.user._id
      }
    },
    defaultWorkspace: workspace._id
  });

  await workspaceOnboardingService.setupDefaults({ workspace, user: req.user });
  await activityLogService.log({
    workspace: workspace._id,
    user: req.user._id,
    module: 'workspace',
    action: 'created',
    refModel: 'Workspace',
    refId: workspace._id,
    description: `Workspace ${workspace.name} created`,
    ipAddress: req.ip
  });

  res.status(201).json({ success: true, message: 'Workspace created successfully', data: workspace, workspace });
});

const getById = asyncHandler(async (req, res) => {
  const workspace = await findWorkspaceForUser(req);
  if (!workspace) return res.status(404).json({ success: false, message: 'Workspace not found' });
  res.json({ success: true, data: workspace, workspace });
});

const update = asyncHandler(async (req, res) => {
  const workspace = await findWorkspaceForUser(req);
  if (!workspace) return res.status(404).json({ success: false, message: 'Workspace not found' });
  if (!isWorkspaceAdmin(req)) return res.status(403).json({ success: false, message: 'Only owner/admin can update workspace' });

  ['name', 'companyName', 'description', 'settings', 'brand', 'storage'].forEach((field) => {
    if (req.body[field] !== undefined) workspace[field] = req.body[field];
  });
  workspace.updatedBy = req.user._id;
  await workspace.save();
  res.json({ success: true, data: workspace, workspace });
});

const archive = asyncHandler(async (req, res) => {
  const workspace = await findWorkspaceForUser(req);
  if (!workspace) return res.status(404).json({ success: false, message: 'Workspace not found' });
  if (!isWorkspaceAdmin(req)) return res.status(403).json({ success: false, message: 'Only owner/admin can archive workspace' });
  workspace.isActive = false;
  workspace.archivedAt = new Date();
  workspace.archivedBy = req.user._id;
  await workspace.save();
  res.json({ success: true, message: 'Workspace archived', data: workspace });
});

const restore = asyncHandler(async (req, res) => {
  const workspace = await Workspace.findOne({ _id: getId(req), isDeleted: { $ne: true } });
  if (!workspace) return res.status(404).json({ success: false, message: 'Workspace not found' });
  workspace.isActive = true;
  workspace.archivedAt = undefined;
  await workspace.save();
  res.json({ success: true, message: 'Workspace restored', data: workspace });
});

const remove = asyncHandler(async (req, res) => {
  const workspace = await findWorkspaceForUser(req);
  if (!workspace) return res.status(404).json({ success: false, message: 'Workspace not found' });
  if (!isWorkspaceAdmin(req)) return res.status(403).json({ success: false, message: 'Only owner/admin can delete workspace' });
  workspace.isDeleted = true;
  workspace.deletedAt = new Date();
  workspace.deletedBy = req.user._id;
  await workspace.save();
  res.json({ success: true, message: 'Workspace deleted' });
});

const switchWorkspace = asyncHandler(async (req, res) => {
  const workspace = await findWorkspaceForUser(req);
  if (!workspace) return res.status(403).json({ success: false, message: 'You do not have access to this workspace' });
  await User.findByIdAndUpdate(req.user._id, { defaultWorkspace: workspace._id });
  res.json({ success: true, message: 'Workspace switched', data: workspace });
});

const getPermissions = asyncHandler(async (req, res) => {
  const workspace = req.workspace || await findWorkspaceForUser(req);
  if (!workspace) return res.status(404).json({ success: false, message: 'Workspace not found' });
  const membership = req.workspaceMembership || (req.user.workspaces || []).find((item) => item.workspace?.toString() === workspace._id.toString());
  const data = await authService.buildWorkspacePermissions({ user: req.user, workspace, membership });
  res.json({ success: true, data });
});

const getModules = asyncHandler(async (req, res) => {
  const allowedModules = { ...workspaceService.getDefaultAllowedModules(), ...(req.workspace.allowedModules?.toObject?.() || req.workspace.allowedModules || {}) };
  res.json({ success: true, data: allowedModules, allowedModules });
});

const updateModules = asyncHandler(async (req, res) => {
  if (!isWorkspaceAdmin(req)) return res.status(403).json({ success: false, message: 'Only owner/admin can update modules' });
  const allowedModules = { ...workspaceService.getDefaultAllowedModules(), ...(req.workspace.allowedModules?.toObject?.() || req.workspace.allowedModules || {}), ...(req.body.allowedModules || {}) };
  req.workspace.allowedModules = allowedModules;
  req.workspace.updatedBy = req.user._id;
  await req.workspace.save();
  const warnings = workspaceService.validateModuleDependencies(allowedModules);
  res.json({ success: true, message: 'Modules updated', data: { allowedModules, warnings }, allowedModules, warnings });
});

const getSettings = asyncHandler(async (req, res) => {
  res.json({ success: true, data: { settings: req.workspace.settings, brand: req.workspace.brand, storage: req.workspace.storage, allowedModules: req.workspace.allowedModules } });
});

const updateSettingsSection = (section) => asyncHandler(async (req, res) => {
  if (!isWorkspaceAdmin(req)) return res.status(403).json({ success: false, message: 'Only owner/admin can update settings' });
  if (section === 'general') {
    ['name', 'companyName', 'description'].forEach((field) => {
      if (req.body[field] !== undefined) req.workspace[field] = req.body[field];
    });
    req.workspace.settings = { ...(req.workspace.settings?.toObject?.() || req.workspace.settings || {}), ...req.body };
  } else if (section === 'modules') {
    req.workspace.allowedModules = { ...(req.workspace.allowedModules?.toObject?.() || req.workspace.allowedModules || {}), ...(req.body.allowedModules || req.body) };
  } else {
    req.workspace[section] = { ...(req.workspace[section]?.toObject?.() || req.workspace[section] || {}), ...req.body };
  }
  req.workspace.updatedBy = req.user._id;
  await req.workspace.save();
  res.json({ success: true, message: 'Settings updated', data: req.workspace });
});

const listMembers = asyncHandler(async (req, res) => {
  const workspace = await req.workspace.populate('members.user members.department');
  res.json({ success: true, data: workspace.members, members: workspace.members });
});

const getMember = asyncHandler(async (req, res) => {
  const workspace = await req.workspace.populate('members.user members.department');
  const member = workspace.members.find((item) => item.user?._id?.toString() === req.params.userId || item.user?.toString() === req.params.userId);
  if (!member) return res.status(404).json({ success: false, message: 'Member not found' });
  res.json({ success: true, data: member, member });
});

const updateMember = asyncHandler(async (req, res) => {
  if (!isWorkspaceAdmin(req)) return res.status(403).json({ success: false, message: 'Only owner/admin can update members' });
  const member = req.workspace.members.find((item) => item.user?.toString() === req.params.userId);
  if (!member) return res.status(404).json({ success: false, message: 'Member not found' });
  ['role', 'department', 'designation', 'allowedModulesOverride', 'deniedModulesOverride', 'isActive'].forEach((field) => {
    if (req.body[field] !== undefined) member[field] = req.body[field];
  });
  await req.workspace.save();
  await syncUserMembership(req.workspace, req.params.userId, {
    role: member.role,
    department: member.department,
    allowedModulesOverride: member.allowedModulesOverride,
    deniedModulesOverride: member.deniedModulesOverride,
    isActive: member.isActive
  });
  res.json({ success: true, message: 'Member updated', data: member });
});

const addMember = asyncHandler(async (req, res) => {
  if (!isWorkspaceAdmin(req)) return res.status(403).json({ success: false, message: 'Only owner/admin can add members' });
  const { userId, role = 'member', department, designation, allowedModulesOverride, deniedModulesOverride } = req.body;
  const user = await User.findById(userId);
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });
  if (req.workspace.members.some((item) => item.user?.toString() === user._id.toString())) {
    return res.status(409).json({ success: false, message: 'User is already a member of this workspace' });
  }

  const member = { user: user._id, role, department, designation, allowedModulesOverride, deniedModulesOverride, isActive: true, addedAt: new Date(), addedBy: req.user._id };
  req.workspace.members.push(member);
  await req.workspace.save();
  user.workspaces.push({ workspace: req.workspace._id, role, department, allowedModulesOverride, deniedModulesOverride, isActive: true, joinedAt: new Date(), addedBy: req.user._id });
  if (!user.defaultWorkspace) user.defaultWorkspace = req.workspace._id;
  await user.save({ validateBeforeSave: false });
  res.json({ success: true, message: 'Member added successfully', data: member });
});

async function syncUserMembership(workspace, userId, changes) {
  const user = await User.findById(userId);
  if (!user) return null;
  const membership = user.workspaces.find((item) => item.workspace?.toString() === workspace._id.toString());
  if (membership) Object.assign(membership, changes);
  await user.save({ validateBeforeSave: false });
  return user;
}

const updateMemberRole = asyncHandler(async (req, res) => {
  if (!isWorkspaceAdmin(req)) return res.status(403).json({ success: false, message: 'Only owner/admin can change roles' });
  const member = req.workspace.members.find((item) => item.user?.toString() === req.params.userId);
  if (!member) return res.status(404).json({ success: false, message: 'Member not found' });
  if (member.role === 'owner' && req.body.role !== 'owner') {
    const owners = req.workspace.members.filter((item) => item.role === 'owner' && item.isActive !== false);
    if (owners.length <= 1) return res.status(400).json({ success: false, message: 'At least one owner must remain' });
  }
  const oldRole = member.role;
  member.role = req.body.role;
  await req.workspace.save();
  await syncUserMembership(req.workspace, req.params.userId, { role: req.body.role });
  await activityLogService.log({ workspace: req.workspace._id, user: req.user._id, module: 'users', action: 'role_changed', refModel: 'User', refId: req.params.userId, oldValue: oldRole, newValue: req.body.role, ipAddress: req.ip });
  res.json({ success: true, message: 'Role updated', data: member });
});

const updateMemberDepartment = asyncHandler(async (req, res) => {
  if (!isWorkspaceAdmin(req)) return res.status(403).json({ success: false, message: 'Only owner/admin can change departments' });
  const member = req.workspace.members.find((item) => item.user?.toString() === req.params.userId);
  if (!member) return res.status(404).json({ success: false, message: 'Member not found' });
  member.department = req.body.department;
  if (req.body.designation !== undefined) member.designation = req.body.designation;
  await req.workspace.save();
  await syncUserMembership(req.workspace, req.params.userId, { department: req.body.department });
  res.json({ success: true, message: 'Department updated', data: member });
});

const setMemberActive = (isActive) => asyncHandler(async (req, res) => {
  if (!isWorkspaceAdmin(req)) return res.status(403).json({ success: false, message: 'Only owner/admin can update members' });
  const member = req.workspace.members.find((item) => item.user?.toString() === req.params.userId);
  if (!member) return res.status(404).json({ success: false, message: 'Member not found' });
  member.isActive = isActive;
  await req.workspace.save();
  await syncUserMembership(req.workspace, req.params.userId, { isActive });
  if (!isActive) await Session.updateMany({ user: req.params.userId, workspace: req.workspace._id, isRevoked: false }, { isRevoked: true, revokedAt: new Date(), revokedReason: 'workspace_deactivated' });
  res.json({ success: true, message: isActive ? 'Member activated' : 'Member deactivated', data: member });
});

const removeMember = asyncHandler(async (req, res) => {
  if (!isWorkspaceAdmin(req)) return res.status(403).json({ success: false, message: 'Only owner/admin can remove members' });
  req.workspace.members = req.workspace.members.filter((item) => item.user?.toString() !== req.params.userId);
  await req.workspace.save();
  await User.findByIdAndUpdate(req.params.userId, { $pull: { workspaces: { workspace: req.workspace._id } } });
  res.json({ success: true, message: 'Member removed from workspace' });
});

const createUserForWorkspace = asyncHandler(async (req, res) => {
  if (!isWorkspaceAdmin(req)) return res.status(403).json({ success: false, message: 'Only owner/admin can create users' });
  const { name, email, phone, designation, department, role = 'member', temporaryPassword, allowedModulesOverride, deniedModulesOverride } = req.body;
  const password = temporaryPassword || crypto.randomBytes(6).toString('base64url') + 'Aa1!';
  const passwordError = validatePassword(password, email);
  if (passwordError) return res.status(400).json({ success: false, message: passwordError });
  const user = await User.create({
    name,
    email,
    phone,
    designation,
    password,
    mustChangePassword: true,
    isEmailVerified: true,
    emailVerifiedAt: new Date(),
    status: 'active',
    workspaces: [{ workspace: req.workspace._id, role, department, allowedModulesOverride, deniedModulesOverride, isActive: true, joinedAt: new Date(), addedBy: req.user._id }],
    defaultWorkspace: req.workspace._id,
    createdBy: req.user._id
  });
  req.workspace.members.push({ user: user._id, role, department, designation, allowedModulesOverride, deniedModulesOverride, isActive: true, addedAt: new Date(), addedBy: req.user._id });
  await req.workspace.save();
  console.info(`[workspace] Temporary credentials for ${email}: ${password}`);
  res.status(201).json({ success: true, message: 'User created successfully', data: { user, temporaryPassword: password } });
});

const listInvites = asyncHandler(async (req, res) => {
  const invites = await WorkspaceInvite.find({ workspace: req.workspace._id }).sort({ createdAt: -1 });
  res.json({ success: true, data: invites, invites });
});

const createInvite = asyncHandler(async (req, res) => {
  if (!isWorkspaceAdmin(req)) return res.status(403).json({ success: false, message: 'Only owner/admin can invite members' });
  const rawToken = tokenService.generateOpaqueToken(32);
  const invite = await WorkspaceInvite.create({
    ...req.body,
    email: String(req.body.email).toLowerCase().trim(),
    workspace: req.workspace._id,
    tokenHash: tokenService.hashToken(rawToken),
    expiresAt: dayjs().add(7, 'day').toDate(),
    invitedBy: req.user._id
  });
  const inviteUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/accept-invite/${rawToken}`;
  console.info(`[workspace] Invite link for ${invite.email}: ${inviteUrl}`);
  res.status(201).json({ success: true, message: 'Invite created', data: { invite, inviteUrl } });
});

const acceptInvite = asyncHandler(async (req, res) => {
  const invite = await WorkspaceInvite.findOne({
    tokenHash: tokenService.hashToken(req.params.token),
    status: 'pending',
    expiresAt: { $gt: new Date() }
  });
  if (!invite) return res.status(400).json({ success: false, message: 'Invalid or expired invite' });

  let user = req.user || await User.findOne({ email: invite.email });
  if (user && !req.user && req.body.mode !== 'new') {
    return res.status(401).json({ success: false, message: 'Please login to accept this invite' });
  }
  if (!req.user && user && req.body.mode === 'new') {
    return res.status(409).json({ success: false, message: 'Account already exists. Please login to accept this invite.' });
  }
  if (!user && req.body.mode === 'new') {
    const passwordError = validatePassword(req.body.password, invite.email);
    if (passwordError) return res.status(400).json({ success: false, message: passwordError });
    user = await User.create({
      name: req.body.name || invite.name || invite.email,
      email: invite.email,
      password: req.body.password,
      isEmailVerified: true,
      emailVerifiedAt: new Date(),
      status: 'active'
    });
  }
  if (!user) return res.status(401).json({ success: false, message: 'Login or create an account to accept invite' });

  const workspace = await Workspace.findById(invite.workspace);
  if (!workspace.members.some((item) => item.user?.toString() === user._id.toString())) {
    workspace.members.push({ user: user._id, role: invite.role, department: invite.department, designation: invite.designation, allowedModulesOverride: invite.allowedModulesOverride, deniedModulesOverride: invite.deniedModulesOverride, isActive: true, addedAt: new Date(), addedBy: invite.invitedBy });
    await workspace.save();
  }
  if (!user.workspaces.some((item) => item.workspace?.toString() === workspace._id.toString())) {
    user.workspaces.push({ workspace: workspace._id, role: invite.role, department: invite.department, allowedModulesOverride: invite.allowedModulesOverride, deniedModulesOverride: invite.deniedModulesOverride, isActive: true, joinedAt: new Date(), addedBy: invite.invitedBy });
    if (!user.defaultWorkspace) user.defaultWorkspace = workspace._id;
    await user.save({ validateBeforeSave: false });
  }
  invite.status = 'accepted';
  invite.acceptedBy = user._id;
  invite.acceptedAt = new Date();
  await invite.save();
  res.json({ success: true, message: 'Invite accepted', data: { workspace } });
});

const workspaceDashboard = asyncHandler(async (req, res) => {
  const [departments, pendingInvites] = await Promise.all([
    Department.countDocuments({ workspace: req.workspace._id, isDeleted: { $ne: true } }),
    WorkspaceInvite.countDocuments({ workspace: req.workspace._id, status: 'pending' })
  ]);
  res.json({
    success: true,
    data: {
      totalMembers: req.workspace.members.filter((item) => item.isActive !== false).length,
      totalDepartments: departments,
      activeModules: Object.values(req.workspace.allowedModules?.toObject?.() || req.workspace.allowedModules || {}).filter(Boolean).length,
      pendingInvites,
      storageUsed: req.workspace.storage?.usedStorageBytes || 0
    }
  });
});

const workspaceActivity = asyncHandler(async (req, res) => {
  const activity = await ActivityLog.find({ workspace: req.workspace._id }).sort({ createdAt: -1 }).limit(100);
  res.json({ success: true, data: activity, activity });
});

const reassignMemberWork = asyncHandler(async (_req, res) => {
  res.json({ success: true, message: 'Reassignment request accepted. Module-specific reassignment will run where supported.' });
});

const forceLogoutMember = asyncHandler(async (req, res) => {
  if (!isWorkspaceAdmin(req)) return res.status(403).json({ success: false, message: 'Only owner/admin can force logout members' });
  await Session.updateMany(
    { user: req.params.userId, isRevoked: false },
    { isRevoked: true, revokedAt: new Date(), revokedReason: 'admin_force_logout' }
  );
  res.json({ success: true, message: 'Member logged out from active sessions' });
});

module.exports = {
  getAll,
  list: getAll,
  getMyWorkspaces,
  create,
  getById,
  getOne: getById,
  update,
  remove,
  delete: remove,
  archive,
  restore,
  switchWorkspace,
  getPermissions,
  getModules,
  updateModules,
  getSettings,
  updateGeneralSettings: updateSettingsSection('general'),
  updateBranding: updateSettingsSection('brand'),
  updateWorkingDays: updateSettingsSection('settings'),
  updateStorage: updateSettingsSection('storage'),
  updateSettingsModules: updateSettingsSection('modules'),
  listMembers,
  getMember,
  addMember,
  createUserForWorkspace,
  updateMember,
  updateMemberRole,
  updateMemberDepartment,
  activateMember: setMemberActive(true),
  deactivateMember: setMemberActive(false),
  removeMember,
  reassignMemberWork,
  forceLogoutMember,
  listInvites,
  createInvite,
  acceptInvite,
  resendInvite: createInvite,
  cancelInvite: asyncHandler(async (req, res) => {
    await WorkspaceInvite.findOneAndUpdate({ _id: req.params.inviteId, workspace: req.workspace._id }, { status: 'cancelled' });
    res.json({ success: true, message: 'Invite cancelled' });
  }),
  workspaceDashboard,
  workspaceActivity
};
