/**
 * Auto-detect environment and generate depth map
 */
export async function generateDepthPNG(parser) {
  // Browser environment
  if (typeof window !== 'undefined' && window.document) {
    const { generateDepthPNGBrowser } = await import('./depthMapGenerator.browser.js');
    return generateDepthPNGBrowser(parser);
  }
  
  // Node.js environment
  const { generateDepthPNGNode } = await import('./depthMapGenerator.node.js');
  return generateDepthPNGNode(parser);
}
