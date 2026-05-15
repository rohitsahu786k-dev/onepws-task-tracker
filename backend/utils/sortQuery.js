const sortQuery = (sort = '-createdAt') => {
  if (typeof sort !== 'string') return { createdAt: -1 };
  return sort.split(',').reduce((acc, field) => {
    const trimmed = field.trim();
    if (!trimmed) return acc;
    acc[trimmed.replace(/^-/, '')] = trimmed.startsWith('-') ? -1 : 1;
    return acc;
  }, {});
};

module.exports = sortQuery;
