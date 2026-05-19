function applyEmployeeSearch(query, search) {
  if (!search) return query;
  const regex = new RegExp(search, 'i');
  query.$or = [
    { employeeCode: regex },
    { displayName: regex },
    { email: regex },
    { phone: regex },
    { jobTitle: regex },
    { 'skills.name': regex },
  ];
  return query;
}

module.exports = { applyEmployeeSearch };
