export function toSVG() {
  return '<svg></svg>';
}

export function toDepthMap() {
  return Promise.resolve('data:image/png;base64,AAA');
}

export function toPrompt() {
  return 'test prompt';
}
