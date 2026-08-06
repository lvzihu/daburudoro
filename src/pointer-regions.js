function normalizeRect(rect) {
  if (!rect) return null;
  const x = Number(rect.x);
  const y = Number(rect.y);
  const width = Number(rect.width);
  const height = Number(rect.height);
  if (![x, y, width, height].every(Number.isFinite) || width <= 0 || height <= 0) {
    return null;
  }
  return { x, y, width, height };
}

function sanitizeRegions(regions) {
  if (!Array.isArray(regions)) return [];
  return regions.map(normalizeRect).filter(Boolean);
}

function pointInRect(point, rect) {
  return (
    point.x >= rect.x &&
    point.x < rect.x + rect.width &&
    point.y >= rect.y &&
    point.y < rect.y + rect.height
  );
}

function pointInRegions(point, regions) {
  if (!point || !Number.isFinite(point.x) || !Number.isFinite(point.y)) return false;
  return sanitizeRegions(regions).some((rect) => pointInRect(point, rect));
}

module.exports = { normalizeRect, sanitizeRegions, pointInRect, pointInRegions };
