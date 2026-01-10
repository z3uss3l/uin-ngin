import { UINParser, validateUIN, renderSVGScene } from '@uin/core';

/**
 * SVG Adapter - converts UIN to SVG
 * @param {string|object} input - UIN JSON (string or object)
 * @param {object} options - Rendering options
 * @returns {string} SVG markup
 */
export function toSVG(input, options = {}) {
  const parser = new UINParser(input);

  // Validate if requested
  if (options.validate !== false) {
    validateUIN(parser.raw);
  }

  return renderSVGScene(parser);
}
