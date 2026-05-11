/**
 * Paginate a Mongoose query
 * @param {Model} model - Mongoose model
 * @param {Object} filter - MongoDB filter object
 * @param {Object} options - { page, limit, sort, populate, select }
 */
const paginateQuery = async (model, filter = {}, options = {}) => {
  const page = Math.max(1, parseInt(options.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(options.limit) || 20));
  const skip = (page - 1) * limit;
  const sort = options.sort || { createdAt: -1 };

  let query = model.find(filter).sort(sort).skip(skip).limit(limit);

  if (options.select) query = query.select(options.select);
  if (options.populate) {
    const populates = Array.isArray(options.populate) ? options.populate : [options.populate];
    populates.forEach((p) => { query = query.populate(p); });
  }

  const [data, total] = await Promise.all([query.lean(), model.countDocuments(filter)]);

  return {
    data,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNext: page < Math.ceil(total / limit),
      hasPrev: page > 1,
    },
  };
};

module.exports = paginateQuery;
