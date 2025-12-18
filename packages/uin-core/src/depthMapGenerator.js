import { createCanvas } from 'canvas';
import { worldToScreen } from './coordinates.js';
import { sortByZ } from './renderHelpers.js';

export function generateDepthPNG(parser) {
  const viewport = parser.viewport;
  const bounds = parser.canvas.bounds;

  const canvas = createCanvas(viewport.width, viewport.height);
  const ctx = canvas.getContext('2d');

  const objects = sortByZ(parser.objects);

  objects.forEach(obj => {
    const p = worldToScreen(obj.position, bounds, viewport);
    const depthNorm = (obj.position.z - bounds.z[0]) / (bounds.z[1] - bounds.z[0]);
    const g = Math.floor(depthNorm * 255);
    ctx.fillStyle = `rgb(${g},${g},${g})`;
    ctx.fillRect(p.x - 5, p.y - 5, 10, 10);
  });

  return canvas.toBuffer('image/png');
      }
