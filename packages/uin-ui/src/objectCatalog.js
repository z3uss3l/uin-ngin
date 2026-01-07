// Simple object catalog used by the CanvasEditor and, later, for prompting
// This is intentionally UI-focused: human-friendly labels, default measurements, colors.

export const OBJECT_CATALOG = [
  // People / characters
  {
    type: 'human',
    label: 'Person (portrait)',
    color: '#3b82f6',
    defaultMeasurements: {
      height: { value: 1.7, unit: 'm' },
    },
    promptKeyword: 'portrait of a person, upper body',
    description: 'Single person, portrait style',
  },
  {
    type: 'human',
    label: 'Person (full body)',
    color: '#2563eb',
    defaultMeasurements: {
      height: { value: 1.7, unit: 'm' },
    },
    promptKeyword: 'full body person standing',
    description: 'Single person, full body view',
  },
  {
    type: 'human',
    label: 'Two people',
    color: '#1d4ed8',
    defaultMeasurements: {
      height: { value: 1.7, unit: 'm' },
    },
    promptKeyword: 'two people together',
    description: 'Two people as main subject',
  },
  {
    type: 'human',
    label: 'Group of people',
    color: '#1e40af',
    defaultMeasurements: {
      height: { value: 1.7, unit: 'm' },
    },
    promptKeyword: 'group of people',
    description: 'Small group of people',
  },

  // Nature
  {
    type: 'tree',
    label: 'Single tree',
    color: '#22c55e',
    defaultMeasurements: {
      height: { value: 6, unit: 'm' },
    },
    promptKeyword: 'single tree',
    description: 'Single tree as subject',
  },
  {
    type: 'tree',
    label: 'Forest tree',
    color: '#16a34a',
    defaultMeasurements: {
      height: { value: 10, unit: 'm' },
    },
    promptKeyword: 'dense forest trees',
    description: 'Tree as Teil eines Waldes',
  },

  // Vehicles
  {
    type: 'car',
    label: 'Car',
    color: '#eab308',
    defaultMeasurements: {
      length: { value: 4.2, unit: 'm' },
    },
    promptKeyword: 'modern car',
    description: 'Generic car or vehicle',
  },
  {
    type: 'car',
    label: 'Sports car',
    color: '#facc15',
    defaultMeasurements: {
      length: { value: 4.5, unit: 'm' },
    },
    promptKeyword: 'sports car',
    description: 'Sportliches Auto',
  },

  // Architecture
  {
    type: 'building',
    label: 'Building',
    color: '#f97316',
    defaultMeasurements: {
      floors: { value: 5, unit: 'level' },
    },
    promptKeyword: 'building',
    description: 'Generic building or structure',
  },
  {
    type: 'building',
    label: 'Skyscraper',
    color: '#fb923c',
    defaultMeasurements: {
      floors: { value: 20, unit: 'level' },
    },
    promptKeyword: 'tall skyscraper',
    description: 'High-rise skyscraper',
  },
  {
    type: 'building',
    label: 'House',
    color: '#fed7aa',
    defaultMeasurements: {
      floors: { value: 2, unit: 'level' },
    },
    promptKeyword: 'family house',
    description: 'Small residential house',
  },
];

export const OBJECT_CATALOG_BY_TYPE = OBJECT_CATALOG.reduce((acc, entry) => {
  acc[entry.type] = entry;
  return acc;
}, {});
