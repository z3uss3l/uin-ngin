import { worldToScreen, sortByZ } from './renderHelpers.js';

/**
 * Generate depth map PNG in browser environment
 */
export function generateDepthPNGBrowser(parser) {
  const viewport = parser.viewport;
  const bounds = parser.canvas.bounds;

  const canvas = document.createElement('canvas');
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  const ctx = canvas.getContext('2d');

  // Black background
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, viewport.width, viewport.height);

  const objects = sortByZ(parser.objects);

  objects.forEach(obj => {
    const p = worldToScreen(obj.position, bounds, viewport);
    const zRange = bounds.z[1] - bounds.z[0];
    const depthNorm = zRange === 0 ? 0.5 : (obj.position.z - bounds.z[0]) / zRange;
    const g = Math.floor((1 - depthNorm) * 255); // Invert: near=white, far=black

    ctx.fillStyle = `rgb(${g},${g},${g})`;

    // Render silhouette
    switch (obj.type) {
      case 'human':
      case 'person': {
        const height = obj.measurements?.height?.value || obj.defaultHeight;
        const h = height * 80;
        ctx.fillRect(p.x - 5, p.y - h, 10, h);
        // Head
        ctx.beginPath();
        ctx.arc(p.x, p.y - h * 0.92, height * 0.08 * 50, 0, Math.PI * 2);
        ctx.fill();
        break;
      }
      case 'tree': {
        const h = obj.defaultHeight * 80;
        ctx.fillRect(p.x - 5, p.y - h, 10, h);
        // Crown
        ctx.beginPath();
        ctx.arc(p.x, p.y - h, h / 2, 0, Math.PI * 2);
        ctx.fill();
        break;
      }
      case 'car': {
        const l = (obj.measurements?.length || obj.defaultLength) * 50;
        ctx.fillRect(p.x - l / 2, p.y - 20, l, 20);
        break;
      }
      case 'building': {
        const floors = obj.measurements?.floors || obj.defaultFloors || 2;
        const h = floors * (obj.floorHeight || 3.0) * 40;
        ctx.fillRect(p.x - 20, p.y - h, 40, h);
        break;
      }
      case 'box':
      case 'bench':
      case 'region':
      case 'color_anchor': {
        const size = obj.type === 'region' ? 16 : 12;
        ctx.fillRect(p.x - size / 2, p.y - size / 2, size, size);
        break;
      }
    }
  });

  return canvas.toDataURL('image/png');
}
