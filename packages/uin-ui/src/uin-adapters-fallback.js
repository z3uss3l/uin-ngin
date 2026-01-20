export function toSVG(uin) {
  try {
    const bounds = uin?.canvas?.bounds || { x: [-10, 10], y: [-10, 10], z: [-5, 5] };
    const width = 900;
    const height = 600;
    const gridStep = 5;
    const objs = Array.isArray(uin?.objects) ? uin.objects : [];

    const project = (pos) => {
      const xRange = bounds.x[1] - bounds.x[0] || 1;
      const yRange = bounds.y[1] - bounds.y[0] || 1;
      const sx = ((pos.x - bounds.x[0]) / xRange) * width;
      const sy = height - ((pos.y - bounds.y[0]) / yRange) * height;
      return { x: sx, y: sy };
    };

    const gridLines = [];
    for (let gx = bounds.x[0]; gx <= bounds.x[1]; gx += gridStep) {
      const sx = ((gx - bounds.x[0]) / (bounds.x[1] - bounds.x[0] || 1)) * width;
      gridLines.push(`<line x1="${sx}" y1="0" x2="${sx}" y2="${height}" stroke="#e2e8f0" stroke-width="0.5" stroke-dasharray="4,4"/>`);
    }
    for (let gy = bounds.y[0]; gy <= bounds.y[1]; gy += gridStep) {
      const sy = height - ((gy - bounds.y[0]) / (bounds.y[1] - bounds.y[0] || 1)) * height;
      gridLines.push(`<line x1="0" y1="${sy}" x2="${width}" y2="${sy}" stroke="#e2e8f0" stroke-width="0.5" stroke-dasharray="4,4"/>`);
    }

    const objectRects = objs
      .map((o, idx) => {
        const pos = o.position || { x: 0, y: 0, z: 0 };
        const { x, y } = project(pos);
        const size = 40;
        const color = o.type === 'human' ? '#3b82f6' : o.type === 'tree' ? '#22c55e' : o.type === 'car' ? '#eab308' : '#ff0000';
        return `
          <g>
            <rect x="${x - size / 2}" y="${y - size / 2}" width="${size}" height="${size}" fill="${color}" stroke="#000" stroke-width="2" />
            <text x="${x}" y="${y - size / 2 - 6}" font-size="12" text-anchor="middle" fill="#111827">${o.id || `obj-${idx}`}</text>
          </g>
        `;
      })
      .join('\n');

    return `
      <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img">
        <rect x="0" y="0" width="${width}" height="${height}" fill="#ffffff"/>
        ${gridLines.join('\n')}
        ${objectRects}
      </svg>
    `;
  } catch (e) {
    return `<svg><text x="10" y="20" fill="red">SVG Error: ${e.message}</text></svg>`;
  }
}

export function toDepthMap() {
  return Promise.resolve('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==');
}

export function toPrompt(uin) {
  try {
    const objects = Array.isArray(uin?.objects) ? uin.objects : [];
    if (objects.length === 0) return 'No objects defined';
    
    const objectDescriptions = objects.map(obj => {
      switch(obj.type) {
        case 'human': return 'person';
        case 'tree': return 'tree';
        case 'car': return 'car';
        case 'building': return 'building';
        default: return obj.type || 'object';
      }
    });
    
    const scene = objectDescriptions.join(', ');
    return `Scene with ${scene}. Highly detailed, photorealistic, cinematic composition, masterpiece`;
  } catch (e) {
    return `Prompt generation error: ${e.message}`;
  }
}
