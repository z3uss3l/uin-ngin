import { OBJECT_TYPES } from './objectTypes.js';

const DEFAULT_BOUNDS = {
  x: [-4, 4],
  y: [0, 4.5],
  z: [-2, 6]
};

export class UINParser {
  constructor(input) {
    this.raw = typeof input === 'string' ? JSON.parse(input) : input;
  }

  get version() {
    return this.raw.version;
  }

  get canvas() {
    const canvas = this.raw.canvas || {};
    return {
      aspect_ratio: canvas.aspect_ratio || '16:9',
      bounds: canvas.bounds || DEFAULT_BOUNDS
    };
  }

  get viewport() {
    const [w, h] = this.canvas.aspect_ratio.split(':').map(Number);
    const height = 1000;
    return {
      width: Math.round((w / h) * height),
      height
    };
  }

  get objects() {
    return (this.raw.objects || []).map(o => this.normalizeObject(o));
  }

  normalizeObject(obj) {
    const def = OBJECT_TYPES[obj.type] || {};
    return {
      ...def,
      ...obj,
      position: obj.position || { x: 0, y: 0, z: 0 }
    };
  }
                        }
