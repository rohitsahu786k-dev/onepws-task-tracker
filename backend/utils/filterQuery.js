const filterQuery = (query = {}, allowed = []) =>
  allowed.reduce((acc, key) => {
    if (query[key] !== undefined && query[key] !== '') acc[key] = query[key];
    return acc;
  }, {});

module.exports = filterQuery;
