export const formatDate = (value, options = {}) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', ...options }).format(date);
};

export const formatDateTime = (value) => formatDate(value, { dateStyle: 'medium', timeStyle: 'short' });

export default formatDate;
