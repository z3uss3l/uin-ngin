// Simple object catalog used by the CanvasEditor and, later, for prompting
// This is intentionally UI-focused: human-friendly labels, default measurements, colors.

export const OBJECT_CATALOG = [
  {
    type: 'human',
    label: 'Human',
    color: '#3b82f6',
    defaultMeasurements: {
      height: { value: 1.7, unit: 'm' },
    },
    description: 'Person / human subject',
  },
  {
    type: 'tree',
    label: 'Tree',
    color: '#22c55e',
    defaultMeasurements: {
      height: { value: 6, unit: 'm' },
    },
    description: 'Tree or vegetation',
  },
  {
    type: 'car',
    label: 'Car',
    color: '#eab308',
    defaultMeasurements: {
      length: { value: 4.2, unit: 'm' },
    },
    description: 'Car / vehicle',
  },
  {
    type: 'building',
    label: 'Building',
    color: '#f97316',
    defaultMeasurements: {
      floors: { value: 5, unit: 'level' },
    },
    description: 'Generic building or structure',
  },
];

export const OBJECT_CATALOG_BY_TYPE = OBJECT_CATALOG.reduce((acc, entry) => {
  acc[entry.type] = entry;
  return acc;
}, {});
