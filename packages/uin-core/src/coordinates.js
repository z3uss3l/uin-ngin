export function worldToNormalized(point, bounds) {
  return {
    x: (point.x - bounds.x[0]) / (bounds.x[1] - bounds.x[0]),
    y: 1 - (point.y - bounds.y[0]) / (bounds.y[1] - bounds.y[0]),
    z: (point.z - bounds.z[0]) / (bounds.z[1] - bounds.z[0])
  };
}

export function normalizedToScreen(norm, viewport) {
  return {
    x: norm.x * viewport.width,
    y: norm.y * viewport.height,
    z: norm.z
  };
}

export function worldToScreenNormalized(point, bounds, viewport) {
  return normalizedToScreen(worldToNormalized(point, bounds), viewport);
}
