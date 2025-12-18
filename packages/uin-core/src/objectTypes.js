export const OBJECT_TYPES = {
  human: {
    defaultHeight: 1.68,
    proportions: {
      head: 0.08,
      torso: 0.4,
      legs: 0.52
    },
    features: ['hair', 'eyes', 'face', 'clothing'],
    required: ['position']
  },
  tree: {
    defaultHeight: 3.0,
    proportions: { trunk: 0.3, crown: 0.7 },
    features: ['leaf_type'],
    required: ['position']
  },
  car: {
    defaultLength: 4.2,
    proportions: { cabin: 0.4, body: 0.6 },
    features: ['type'],
    required: ['position']
  },
  building: {
    defaultFloors: 2,
    floorHeight: 3.0,
    features: ['roof_type', 'windows'],
    required: ['position']
  }
};
