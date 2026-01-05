/**
 * Sort objects by Z-coordinate
 * @param {Array} objects - Objects to sort
 * @param {boolean} reverse - If true, sort back to front (for rendering)
 */
export function sortByZ(objects, reverse = false) {
  const sorted = [...objects].sort((a, b) => {
    const zA = a.position?.z ?? 0;
    const zB = b.position?.z ?? 0;
    return zA - zB;
  });
  return reverse ? sorted.reverse() : sorted;
}

/**
 * Calculate scale factor based on depth
 * Near objects (low z) = scale 1.0, far objects (high z) = scale 0.0
 */
export function scaleByDepth(z, bounds) {
  const depthNorm = (z - bounds.z[0]) / (bounds.z[1] - bounds.z[0]);
  return 1 - depthNorm;
}

/**
 * Calculate opacity based on depth (atmospheric perspective)
 */
export function opacityByDepth(z, bounds) {
  const depthNorm = (z - bounds.z[0]) / (bounds.z[1] - bounds.z[0]);
  return 1 - (depthNorm * 0.3); // Near: 1.0, Far: 0.7
}

/**
 * Convert world coordinates to screen coordinates
 */
export function worldToScreen(position, bounds, viewport) {
  const xNorm = (position.x - bounds.x[0]) / (bounds.x[1] - bounds.x[0]);
  const yNorm = 1 - (position.y - bounds.y[0]) / (bounds.y[1] - bounds.y[0]);
  return {
    x: xNorm * viewport.width,
    y: yNorm * viewport.height
  };
}
