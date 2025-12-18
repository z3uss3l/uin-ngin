export function sortByZ(objects) {
  return [...objects].sort((a, b) => (a.position.z ?? 0) - (b.position.z ?? 0));
}

export function scaleByDepth(base, z, bounds) {
  const depthNorm = (z - bounds.z[0]) / (bounds.z[1] - bounds.z[0]);
  return base * (0.6 + depthNorm * 0.4);
}
