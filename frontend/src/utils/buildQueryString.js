export const buildQueryString = (params = {}) => {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    if (Array.isArray(value)) value.forEach((item) => search.append(key, item));
    else search.set(key, value);
  });
  const query = search.toString();
  return query ? `?${query}` : '';
};

export default buildQueryString;
