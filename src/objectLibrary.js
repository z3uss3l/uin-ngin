export const OBJECT_TYPES = {
  human: {
    defaultHeight: 1.68,
    proportions: {
      head: 0.08,
      torso: 0.4,
      legs: 0.52
    },
    features: ['hair', 'eyes', 'face', 'clothing']
  },
  tree: {
    defaultHeight: 12,
    proportions: {
      trunk: 0.3,
      crown: 0.7
    }
  },
  car: {
    defaultHeight: 1.5,
    defaultWidth: 1.8,
    defaultLength: 4.5,
    types: ['sedan', 'suv', 'sports']
  },
  building: {
    defaultHeight: 20,
    types: ['house', 'skyscraper', 'shop'],
    features: ['windows', 'door', 'roof']
  },
  bench: {
    defaultHeight: 0.45,
    defaultWidth: 1.5,
    defaultDepth: 0.6
  },
  dog: {
    defaultHeight: 0.6,
    breeds: ['labrador', 'german_shepherd', 'beagle']
  }
};

export const renderObject = (obj, worldToScreen, yRange, height) => {
  const type = OBJECT_TYPES[obj.type];
  if (!type) return null;
  
  const h = obj.measurements?.height?.value || type.defaultHeight;
  const scale = (h / yRange) * height;
  
  const pos = obj.position || {x: 0, y: 0, z: 0};
  const [sx, sy] = worldToScreen(pos.x, pos.y);
  
  let elements = [];
  
  switch(obj.type) {
    case 'human':
      const headRadius = scale * 0.08;
      const headY = sy - scale * 0.92;
      elements.push(`<circle cx="${sx}" cy="${headY}" r="${headRadius}" fill="#FFD7B5"/>`);
      
      const bodyWidth = scale * 0.15;
      const bodyHeight = scale * 0.4;
      const bodyY = headY + headRadius;
      elements.push(`<rect x="${sx - bodyWidth/2}" y="${bodyY}" width="${bodyWidth}" height="${bodyHeight}" fill="#4A90E2"/>`);
      
      if (obj.features?.hair?.color?.hex) {
        elements.push(`<circle cx="${sx}" cy="${headY - headRadius * 0.3}" r="${headRadius * 1.2}" fill="${obj.features.hair.color.hex}" opacity="0.7"/>`);
      }
      break;
      
    case 'tree':
      const trunkWidth = scale * 0.05;
      const trunkHeight = scale * 0.3;
      elements.push(`<rect x="${sx - trunkWidth/2}" y="${sy - trunkHeight}" width="${trunkWidth}" height="${trunkHeight}" fill="#8B4513"/>`);
      
      const crownRadius = scale * 0.15;
      elements.push(`<circle cx="${sx}" cy="${sy - trunkHeight - crownRadius}" r="${crownRadius}" fill="#228B22"/>`);
      break;
      
    case 'car':
      const carWidth = scale * 1.2;
      const carHeight = scale;
      elements.push(`<rect x="${sx - carWidth/2}" y="${sy - carHeight}" width="${carWidth}" height="${carHeight}" fill="#333333" rx="5"/>`);
      // Windows
      elements.push(`<rect x="${sx - carWidth/3}" y="${sy - carHeight*0.8}" width="${carWidth*0.6}" height="${carHeight*0.4}" fill="#87CEEB" opacity="0.7"/>`);
      // Wheels
      const wheelRadius = scale * 0.15;
      elements.push(`<circle cx="${sx - carWidth*0.3}" cy="${sy}" r="${wheelRadius}" fill="#000"/>`);
      elements.push(`<circle cx="${sx + carWidth*0.3}" cy="${sy}" r="${wheelRadius}" fill="#000"/>`);
      break;
      
    case 'building':
      const bWidth = scale * 0.8;
      const bHeight = scale;
      elements.push(`<rect x="${sx - bWidth/2}" y="${sy - bHeight}" width="${bWidth}" height="${bHeight}" fill="#CCCCCC" stroke="#888" stroke-width="2"/>`);
      // Windows in grid
      for(let i = 0; i < 3; i++) {
        for(let j = 0; j < 4; j++) {
          const wx = sx - bWidth/3 + (i * bWidth/3);
          const wy = sy - bHeight*0.9 + (j * bHeight/5);
          elements.push(`<rect x="${wx}" y="${wy}" width="${bWidth*0.15}" height="${bHeight*0.12}" fill="#87CEEB"/>`);
        }
      }
      break;
      
    case 'bench':
      const benchWidth = scale * 3;
      const benchHeight = scale;
      // Seat
      elements.push(`<rect x="${sx - benchWidth/2}" y="${sy - benchHeight}" width="${benchWidth}" height="${benchHeight*0.2}" fill="#8B4513"/>`);
      // Legs
      elements.push(`<rect x="${sx - benchWidth/2.2}" y="${sy - benchHeight*0.8}" width="${benchWidth*0.1}" height="${benchHeight*0.8}" fill="#8B4513"/>`);
      elements.push(`<rect x="${sx + benchWidth/2.8}" y="${sy - benchHeight*0.8}" width="${benchWidth*0.1}" height="${benchHeight*0.8}" fill="#8B4513"/>`);
      break;
      
    case 'dog':
      const dogScale = scale * 0.35;
      // Body
      elements.push(`<ellipse cx="${sx}" cy="${sy - dogScale}" rx="${dogScale*1.5}" ry="${dogScale}" fill="#D2691E"/>`);
      // Head
      elements.push(`<circle cx="${sx + dogScale*0.8}" cy="${sy - dogScale*1.2}" r="${dogScale*0.5}" fill="#D2691E"/>`);
      // Legs
      for(let i = 0; i < 4; i++) {
        const legX = sx - dogScale + (i * dogScale*0.6);
        elements.push(`<rect x="${legX}" y="${sy - dogScale*0.5}" width="${dogScale*0.2}" height="${dogScale*0.6}" fill="#8B4513"/>`);
      }
      break;
  }
  
  return elements.join('\n  ');
};
