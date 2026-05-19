const cache = new Map();

async function getCachedWidgetData(cacheKey, resolver, ttlSeconds = 60) {
  const cached = cache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) return cached.data;
  const data = await resolver();
  cache.set(cacheKey, { data, expiresAt: Date.now() + ttlSeconds * 1000 });
  return data;
}

function clear() {
  cache.clear();
}

module.exports = { getCachedWidgetData, clear };
