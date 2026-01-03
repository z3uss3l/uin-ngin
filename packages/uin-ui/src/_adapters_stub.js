module.exports = {
  toSVG: () => '<svg></svg>',
  toDepthMap: () => Promise.resolve('data:image/png;base64,AAA'),
  toPrompt: () => 'test prompt'
};
