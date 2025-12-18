import { UINParser, validateUIN } from '@uin/core';

/**
 * Prompt Adapter - generates text-to-image prompt from UIN
 * @param {string|object} input - UIN JSON
 * @param {object} options - Generation options
 * @returns {string} Optimized prompt for T2I models
 */
export function toPrompt(input, options = {}) {
  const parser = new UINParser(input);
  
  // Validate if requested
  if (options.validate !== false) {
    validateUIN(parser.raw);
  }
  
  const parts = [];
  
  // Global lighting
  const lighting = parser.raw.global?.lighting?.type;
  if (lighting) {
    parts.push(`${lighting} lighting`);
  }
  
  // Objects
  parser.objects.forEach(obj => {
    const objDesc = describeObject(obj);
    if (objDesc) parts.push(objDesc);
  });
  
  // Quality tags
  if (options.qualityTags !== false) {
    parts.push('highly detailed', 'photorealistic', 'cinematic composition', 'masterpiece');
  }
  
  // Style modifiers
  if (options.style) {
    parts.push(options.style);
  }
  
  return parts.join(', ');
}

/**
 * Generate negative prompt
 */
export function toNegativePrompt(options = {}) {
  const defaults = [
    'blurry',
    'deformed',
    'disfigured',
    'low quality',
    'worst quality',
    'ugly',
    'duplicate',
    'extra limbs'
  ];
  
  return [...defaults, ...(options.additional || [])].join(', ');
}

/**
 * Describe a single object for prompt
 */
function describeObject(obj) {
  const parts = [];
  
  switch (obj.type) {
    case 'human': {
      // Base description
      parts.push(obj.description || 'person');
      
      // Hair
      if (obj.features?.hair) {
        const hair = obj.features.hair;
        if (hair.length) parts.push(`${hair.length} hair`);
        if (hair.color?.hex) parts.push('distinctive hair color');
        if (hair.style) parts.push(`${hair.style} hairstyle`);
      }
      
      // Eyes
      if (obj.features?.eyes?.color) {
        parts.push(`${obj.features.eyes.color} eyes`);
      }
      
      // Clothing
      if (obj.features?.clothing?.color) {
        parts.push('wearing colorful clothing');
      }
      
      // Expression
      if (obj.features?.face?.expression) {
        parts.push(obj.features.face.expression);
      }
      
      break;
    }
    
    case 'tree': {
      const height = obj.measurements?.height?.value || obj.defaultHeight;
      if (height > 10) {
        parts.push('large tree');
      } else if (height > 5) {
        parts.push('medium tree');
      } else {
        parts.push('small tree');
      }
      
      if (obj.features?.leaf_type) {
        parts.push(`${obj.features.leaf_type} leaves`);
      }
      
      // Position context
      if (obj.position.z > 2) {
        parts.push('in background');
      }
      
      break;
    }
    
    case 'car': {
      const type = obj.features?.type || 'modern';
      parts.push(`${type} car`);
      
      if (obj.position.z > 2) {
        parts.push('in distance');
      }
      
      break;
    }
    
    case 'building': {
      const floors = obj.measurements?.floors || obj.defaultFloors || 2;
      if (floors > 10) {
        parts.push('tall skyscraper');
      } else if (floors > 5) {
        parts.push('multi-story building');
      } else {
        parts.push('building');
      }
      
      if (obj.features?.roof_type) {
        parts.push(`with ${obj.features.roof_type} roof`);
      }
      
      if (obj.position.z > 3) {
        parts.push('in far background');
      }
      
      break;
    }
  }
  
  return parts.join(', ');
}

/**
 * Generate structured prompt for advanced models
 */
export function toStructuredPrompt(input, options = {}) {
  const parser = new UINParser(input);
  
  return {
    positive: toPrompt(input, options),
    negative: toNegativePrompt(options),
    metadata: {
      lighting: parser.raw.global?.lighting?.type,
      objectCount: parser.objects.length,
      aspectRatio: parser.canvas.aspect_ratio,
      complexity: calculateComplexity(parser)
    }
  };
}

function calculateComplexity(parser) {
  let score = 0;
  
  // Object count
  score += parser.objects.length * 2;
  
  // Features
  parser.objects.forEach(obj => {
    if (obj.features) score += Object.keys(obj.features).length;
    if (obj.measurements) score += Object.keys(obj.measurements).length;
  });
  
  if (score < 5) return 'simple';
  if (score < 15) return 'medium';
  return 'complex';
}
