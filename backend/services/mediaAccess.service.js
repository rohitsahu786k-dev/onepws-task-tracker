function checkMediaAccess(media, user, workspaceRole, departmentId) {
  if (user.globalRole === "super_admin") return true;
  if (workspaceRole === "admin") return true;

  const visibility = media.permissions?.visibility || "workspace";

  if (visibility === "workspace") return true;

  if (visibility === "private") {
    return media.uploadedBy?.toString() === user._id.toString();
  }

  if (visibility === "department") {
    if (!media.permissions.departments) return false;
    return media.permissions.departments.some(
      dep => dep.toString() === departmentId?.toString()
    );
  }

  if (visibility === "restricted") {
    if (!media.permissions) return false;
    
    const allowedUser = media.permissions.allowedUsers?.some(
      id => id.toString() === user._id.toString()
    );

    const allowedRole = media.permissions.allowedRoles?.includes(workspaceRole);

    return allowedUser || allowedRole;
  }

  return false;
}

module.exports = {
  checkMediaAccess
};
