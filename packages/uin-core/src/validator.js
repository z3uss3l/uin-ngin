import { OBJECT_TYPES } from './objectTypes.js';
import { logger } from './logger.js';

export function validateUIN(uin) {
  logger.debug('validate.start', { version: uin?.version, objects: Array.isArray(uin?.objects) ? uin.objects.length : 0 });
  if (!uin || typeof uin !== 'object') throw new Error('UIN: document must be an object');
  if (uin.version !== '0.8') throw new Error(`UIN: unsupported version ${uin.version ?? '(missing)'}`);
  if (!uin.canvas || !uin.canvas.bounds) throw new Error('UIN: canvas.bounds missing');
  if (typeof uin.canvas.aspect_ratio !== 'string' ||
      !/^[1-9]\d*(?:\.[0-9]+)?:[1-9]\d*(?:\.[0-9]+)?$/.test(uin.canvas.aspect_ratio)) {
    throw new Error('UIN: invalid canvas.aspect_ratio');
  }

  const b = uin.canvas.bounds;
  ['x', 'y', 'z'].forEach(axis => {
    if (!Array.isArray(b[axis]) || b[axis].length !== 2 ||
        b[axis].some(v => typeof v !== 'number' || !Number.isFinite(v))) {
      throw new Error(`UIN: invalid bounds for ${axis}`);
    }
    if (b[axis][0] > b[axis][1]) throw new Error(`UIN: invalid bounds order for ${axis}`);
  });

  if (!Array.isArray(uin.objects) || uin.objects.length < 1) {
    throw new Error('UIN: objects must be a non-empty array');
  }

  const ids = new Set();
  uin.objects.forEach((obj, i) => {
    if (!obj || typeof obj !== 'object') throw new Error(`UIN: object ${i} invalid`);
    if (!obj.id || typeof obj.id !== 'string') throw new Error(`UIN: object ${i} id missing`);
    if (ids.has(obj.id)) throw new Error(`UIN: duplicate object id ${obj.id}`);
    ids.add(obj.id);

    const def = OBJECT_TYPES[obj.type];
    if (!def) throw new Error(`UIN: unknown object type ${obj.type} at ${i}`);

    if (!obj.position || ['x','y','z'].some(k => typeof obj.position[k] !== 'number' || !Number.isFinite(obj.position[k]))) {
      throw new Error(`UIN: object ${i} invalid position`);
    }

    if (obj.measurements && (typeof obj.measurements !== 'object' || Array.isArray(obj.measurements))) {
      throw new Error(`UIN: object ${i} measurements invalid`);
    }
    if (obj.features && (typeof obj.features !== 'object' || Array.isArray(obj.features))) {
      throw new Error(`UIN: object ${i} features invalid`);
    }
  });

  logger.debug('validate.success', { version: uin.version, objects: uin.objects.length });
  return true;
}
