import { worldToScreen } from './coordinates.js';
import { sortByZ, scaleByDepth } from './renderHelpers.js';

export function renderSVGScene(parser) {
  const { bounds } = parser.canvas;
  const viewport = parser.viewport;
  const objects = sortByZ(parser.objects);

  const elements = objects.map(obj => {
    const p = worldToScreen(obj.position, bounds, viewport);

    switch (obj.type) {
      case 'human': {
        const h = scaleByDepth(obj.defaultHeight, obj.position.z, bounds);
        return `<line x1="${p.x}" y1="${p.y}" x2="${p.x}" y2="${p.y - h * 80}" stroke="black" />`;
      }
      case 'tree': {
        const h = scaleByDepth(obj.defaultHeight, obj.position.z, bounds);
        return `<rect x="${p.x - 5}" y="${p.y - h * 60}" width="10" height="${h * 60}" fill="brown" />`;
      }
      case 'car': {
        const l = scaleByDepth(obj.defaultLength, obj.position.z, bounds);
        return `<rect x="${p.x - l * 10}" y="${p.y - 10}" width="${l * 20}" height="10" fill="blue" />`;
      }
      case 'building': {
        const h = scaleByDepth(obj.defaultFloors * obj.floorHeight, obj.position.z, bounds);
        return `<rect x="${p.x - 20}" y="${p.y - h * 40}" width="40" height="${h * 40}" fill="gray" />`;
      }
      default:
        return '';
    }
  }).join('
');

  return `<svg width="${viewport.width}" height="${viewport.height}" xmlns="http://www.w3.org/2000/svg">${elements}</svg>`;
    }
