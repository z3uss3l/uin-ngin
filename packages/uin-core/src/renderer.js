import { worldToScreen, scaleByDepth, opacityByDepth, sortByZ } from './renderHelpers.js';

function safeColor(value, fallback) {
  if (typeof value !== 'string') return fallback;
  const v = value.trim();
  if (/^#[0-9a-fA-F]{3,8}$/.test(v)) return v;
  if (/^rgb(a)?\((?:[^()]+)\)$/.test(v)) return v;
  if (/^[a-zA-Z]{1,32}$/.test(v)) return v;
  return fallback;
}

/**
 * Render complete UIN scene to SVG
 */
export function renderSVGScene(parser) {
  const bounds = parser.canvas.bounds;
  const viewport = parser.viewport;
  const objects = sortByZ(parser.objects, true); // Back to front for layering

  const elements = [];

  // Background
  const bgColor = parser.raw.global?.lighting?.type === 'golden_hour' ? '#FFD8A8' : '#87CEEB';
  elements.push(`<rect width="${viewport.width}" height="${viewport.height}" fill="${bgColor}"/>`);

  // Ground plane
  const groundY = viewport.height * 0.7;
  elements.push(`<rect x="0" y="${groundY}" width="${viewport.width}" height="${viewport.height - groundY}" fill="#228B22"/>`);

  // Render objects
  objects.forEach(obj => {
    const rendered = renderObject(obj, bounds, viewport);
    if (rendered) elements.push(rendered);
  });

  return `<svg width="${viewport.width}" height="${viewport.height}" xmlns="http://www.w3.org/2000/svg">
  ${elements.join('\n  ')}
</svg>`;
}

/**
 * Render single object
 */
function renderObject(obj, bounds, viewport) {
  const p = worldToScreen(obj.position, bounds, viewport);
  const scale = scaleByDepth(obj.position.z, bounds);
  const opacity = opacityByDepth(obj.position.z, bounds);

  switch (obj.type) {
    case 'human':
    case 'person':
      return renderHuman(obj, p, scale, opacity);
    case 'human_group':
      return renderHumanGroup(obj, p, scale, opacity);
    case 'tree':
      return renderTree(obj, p, scale, opacity);
    case 'car':
      return renderCar(obj, p, scale, opacity);
    case 'building':
      return renderBuilding(obj, p, scale, opacity);
    case 'box':
    case 'bench':
      return renderBox(obj, p, scale, opacity);
    case 'region':
      return renderRegion(obj, p, scale, opacity);
    case 'color_anchor':
      return renderColorAnchor(obj, p, opacity);
    default:
      return null;
  }
}

/**
 * Render human with full proportions
 */
function renderHuman(obj, p, scale, opacity) {
  const height = obj.measurements?.height?.value || obj.defaultHeight;
  const proportions = obj.proportions || { head: 0.08, torso: 0.4, legs: 0.52 };
  
  const headRadius = height * proportions.head * scale * 50;
  const headY = p.y - height * scale * 80;
  
  const elements = [];
  
  // Head
  elements.push(`<circle cx="${p.x}" cy="${headY}" r="${headRadius}" fill="#FFD7B5" opacity="${opacity}"/>`);
  
  // Body
  const bodyHeight = height * proportions.torso * scale * 80;
  const bodyWidth = height * 0.15 * scale * 50;
  const bodyColor = safeColor(obj.features?.clothing?.color, '#4A90E2');
  elements.push(`<rect x="${p.x - bodyWidth/2}" y="${headY + headRadius}" width="${bodyWidth}" height="${bodyHeight}" fill="${bodyColor}" opacity="${opacity}"/>`);
  
  // Legs
  const legHeight = height * proportions.legs * scale * 80;
  const legY = headY + headRadius + bodyHeight;
  elements.push(`<rect x="${p.x - bodyWidth/2}" y="${legY}" width="${bodyWidth}" height="${legHeight}" fill="#2C3E50" opacity="${opacity}"/>`);
  
  // Hair (if features exist)
  if (obj.features?.hair?.color?.hex) {
    elements.push(`<circle cx="${p.x}" cy="${headY - headRadius * 0.3}" r="${headRadius * 1.2}" fill="${safeColor(obj.features.hair.color.hex, "#333333")}" opacity="${opacity * 0.9}"/>`);
  }
  
  return elements.join('\n  ');
}

function renderHumanGroup(obj, p, scale, opacity) {
  const rawCount = obj.features?.members ?? obj.properties?.count ?? 3;
  const count = Math.max(1, Math.min(20, Number.isFinite(Number(rawCount)) ? Math.round(Number(rawCount)) : 3));
  const spacing = 24 * Math.max(0.5, scale);
  return Array.from({ length: count }, (_, i) => {
    const offset = (i - (count - 1) / 2) * spacing;
    return renderHuman({ ...obj, type: 'human', position: { ...obj.position, x: obj.position.x + offset / Math.max(1, scale) } }, p, scale, opacity);
  }).join('\n  ');
}

/**
 * Render tree with trunk and crown
 */
function renderTree(obj, p, scale, opacity) {
  const h = obj.defaultHeight * scale * 80;
  const trunkWidth = 10 * scale;
  
  const elements = [];
  elements.push(`<rect x="${p.x - trunkWidth/2}" y="${p.y - h}" width="${trunkWidth}" height="${h}" fill="#8B4513" opacity="${opacity}"/>`);
  elements.push(`<circle cx="${p.x}" cy="${p.y - h}" r="${h/2}" fill="#228B22" opacity="${opacity}"/>`);
  
  return elements.join('\n  ');
}

/**
 * Render car with body, windows, and wheels
 */
function renderCar(obj, p, scale, opacity) {
  const l = (obj.measurements?.length || obj.defaultLength) * scale * 50;
  const h = 20;
  
  const elements = [];
  
  // Body
  elements.push(`<rect x="${p.x - l/2}" y="${p.y - h}" width="${l}" height="${h}" fill="#333333" rx="3" opacity="${opacity}"/>`);
  
  // Windows
  const winW = l * 0.5;
  elements.push(`<rect x="${p.x - winW/2}" y="${p.y - h * 0.8}" width="${winW}" height="${h * 0.4}" fill="#87CEEB" opacity="${opacity * 0.7}"/>`);
  
  // Wheels
  const wheelR = h * 0.4;
  elements.push(`<circle cx="${p.x - l * 0.3}" cy="${p.y}" r="${wheelR}" fill="#000" opacity="${opacity}"/>`);
  elements.push(`<circle cx="${p.x + l * 0.3}" cy="${p.y}" r="${wheelR}" fill="#000" opacity="${opacity}"/>`);
  
  return elements.join('\n  ');
}

/**
 * Render building with windows
 */
function renderBuilding(obj, p, scale, opacity) {
  const floors = obj.measurements?.floors || obj.defaultFloors || 2;
  const h = floors * (obj.floorHeight || 3.0) * scale * 40;
  const w = 40;
  
  const elements = [];
  
  // Structure
  elements.push(`<rect x="${p.x - w/2}" y="${p.y - h}" width="${w}" height="${h}" fill="#CCCCCC" stroke="#888888" stroke-width="1" opacity="${opacity}"/>`);
  
  // Windows (2x3 grid)
  const winW = w * 0.2;
  const winH = h * 0.15;
  for (let i = 0; i < 2; i++) {
    for (let j = 0; j < 3; j++) {
      const wx = p.x - w * 0.3 + (i * w * 0.4);
      const wy = p.y - h * 0.9 + (j * h * 0.3);
      elements.push(`<rect x="${wx}" y="${wy}" width="${winW}" height="${winH}" fill="#87CEEB" opacity="${opacity * 0.8}"/>`);
    }
  }
  
  return elements.join('\n  ');
  }


function renderBox(obj, p, scale, opacity) {
  const dims = obj.properties?.dimensions || obj.dimensions || {};
  const w = Math.max(10, Number(dims.width ?? 1) * scale * 40);
  const h = Math.max(10, Number(dims.height ?? 1) * scale * 40);
  const color = safeColor(typeof obj.features?.color === 'string' ? obj.features.color : '#777777', '#777777');
  return `<rect x="${p.x - w / 2}" y="${p.y - h}" width="${w}" height="${h}" fill="${color}" opacity="${opacity}"/>`;
}

function renderRegion(obj, p, scale, opacity) {
  const area = Number(obj.properties?.area ?? 1);
  const radius = Math.max(3, Math.sqrt(Math.max(1, area)) * Math.max(0.05, scale) * 0.2);
  return `<circle cx="${p.x}" cy="${p.y}" r="${radius}" fill="#9B59B6" fill-opacity="${Math.min(1, opacity * 0.55)}" stroke="#E8C8FF" stroke-opacity="${opacity}" stroke-width="2"/>`;
}

function renderColorAnchor(obj, p, opacity) {
  const c = obj.features?.color || obj.properties?.rgb;
  const rgb = Array.isArray(c) ? c : [c?.r ?? 128, c?.g ?? 128, c?.b ?? 128];
  const color = `rgb(${rgb.map(v => Math.max(0, Math.min(255, Number(v) || 0))).join(',')})`;
  return `<circle cx="${p.x}" cy="${p.y}" r="8" fill="${color}" fill-opacity="${opacity}" stroke="#FFFFFF" stroke-width="2"/>`;
}
