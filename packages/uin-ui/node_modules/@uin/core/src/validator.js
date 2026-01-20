import { OBJECT_TYPES } from './objectTypes.js';

export function validateUIN(uin) {
  if (!uin.version) throw new Error('UIN: version missing');
  if (!uin.canvas || !uin.canvas.bounds) {
    throw new Error('UIN: canvas.bounds missing');
  }

  const b = uin.canvas.bounds;
  ['x', 'y', 'z'].forEach(axis => {
    if (!Array.isArray(b[axis]) || b[axis].length !== 2) {
      throw new Error(`UIN: invalid bounds for ${axis}`);
    }
  });

  if (!Array.isArray(uin.objects)) {
    throw new Error('UIN: objects must be array');
  }

  uin.objects.forEach((obj, i) => {
    const def = OBJECT_TYPES[obj.type];
    if (!def) throw new Error(`UIN: unknown object type ${obj.type} at ${i}`);

    if (!obj.position || ['x','y','z'].some(k => typeof obj.position[k] !== 'number')) {
      throw new Error(`UIN: object ${i} invalid position`);
    }

    if (obj.measurements && typeof obj.measurements !== 'object') {
      throw new Error(`UIN: object ${i} measurements invalid`);
    }

    if (obj.features && !Array.isArray(obj.features)) {
      throw new Error(`UIN: object ${i} features invalid`);
    }
  });

  return true;
        }
