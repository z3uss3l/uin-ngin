import React, { useEffect, useRef, useState } from 'react';
import { OBJECT_CATALOG, OBJECT_CATALOG_BY_TYPE } from './objectCatalog';

// Simple interactive canvas editor for UIN objects (human, tree, car, building, ...)
// - Renders a top-down view based on canvas.bounds and objects[].position
// - Lets the user add objects and drag existing ones; writes back into UI

const VIEW_WIDTH = 600;
const VIEW_HEIGHT = 400;

function worldToScreen(pos, bounds) {
  const xRange = bounds.x[1] - bounds.x[0] || 1;
  const zRange = bounds.z[1] - bounds.z[0] || 1;
  const sx = ((pos.x - bounds.x[0]) / xRange) * VIEW_WIDTH;
  const sy = VIEW_HEIGHT - ((pos.z - bounds.z[0]) / zRange) * VIEW_HEIGHT;
  return { x: sx, y: sy };
}

function hitTestObject(obj, bounds, x, y) {
  const screenPos = worldToScreen(obj.position, bounds);
  const r = 14; // hit radius
  const dx = x - screenPos.x;
  const dy = y - screenPos.y;
  return dx * dx + dy * dy <= r * r;
}

export default function CanvasEditorClean({ uinJSON, onChange }) {
  const canvasRef = useRef(null);
  const [selectedTool, setSelectedTool] = useState('human'); // Default to human
  const [dragState, setDragState] = useState(null);
  const [localError, setLocalError] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Parse once per render; for editing we always go through JSON from App
  let doc = null;
  try {
    doc = JSON.parse(uinJSON || '{}');
  } catch (e) {
    doc = null;
  }

  // Derived safe structure
  const bounds = doc?.canvas?.bounds || { x: [-10, 10], y: [-10, 10], z: [-5, 5] };
  const objects = Array.isArray(doc?.objects) ? doc.objects : [];

  // Rendering
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !doc) return;

    // jsdom in tests does not implement canvas.getContext by default
    const ctx = typeof canvas.getContext === 'function' ? canvas.getContext('2d') : null;
    if (!ctx) return;

    ctx.clearRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);

    // Background
    ctx.fillStyle = '#111827';
    ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);

    // Grid
    ctx.strokeStyle = '#1f2937';
    ctx.lineWidth = 1;
    for (let i = 1; i < 6; i++) {
      const x = (VIEW_WIDTH / 6) * i;
      const y = (VIEW_HEIGHT / 6) * i;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, VIEW_HEIGHT);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(VIEW_WIDTH, y);
      ctx.stroke();
    }

    // Objects
    objects.forEach((obj) => {
      if (!obj.position) return;
      const { x, y } = worldToScreen(obj.position, bounds);
      const spec = OBJECT_CATALOG_BY_TYPE[obj.type] || {};
      const color = spec.color || '#22c55e';
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x, y, 10, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#e5e7eb';
      ctx.font = '10px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText(obj.type || '?', x, y - 14);
    });
  }, [uinJSON]);

  const handleCanvasClick = (evt) => {
    if (!doc) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = evt.clientX - rect.left;
    const y = evt.clientY - rect.top;

    if (!selectedTool) return;

    // Convert screen -> world (x,z)
    const xRange = bounds.x[1] - bounds.x[0] || 1;
    const zRange = bounds.z[1] - bounds.z[0] || 1;
    const wx = bounds.x[0] + (x / VIEW_WIDTH) * xRange;
    const wz = bounds.z[0] + ((VIEW_HEIGHT - y) / VIEW_HEIGHT) * zRange;

    const newDoc = { ...doc, objects: [...objects] };
    const idSuffix = objects.length + 1;

    const spec = OBJECT_CATALOG_BY_TYPE[selectedTool];
    const measurements = spec?.defaultMeasurements || {};

    const base = {
      id: `${selectedTool}${idSuffix}`,
      type: selectedTool,
      position: { x: wx, y: 0, z: wz },
      ...(spec?.promptKeyword ? { description: spec.promptKeyword } : {}),
      ...(Object.keys(measurements).length ? { measurements } : {}),
    };

    newDoc.objects.push(base);
    try {
      onChange(JSON.stringify(newDoc, null, 2));
      setLocalError('');
    } catch (e) {
      setLocalError(e.message);
    }
  };

  const handleMouseDown = (evt) => {
    if (!doc) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = evt.clientX - rect.left;
    const y = evt.clientY - rect.top;

    // Find top-most hit
    for (let i = objects.length - 1; i >= 0; i -= 1) {
      const obj = objects[i];
      if (obj.position && hitTestObject(obj, bounds, x, y)) {
        setDragState({ index: i, offset: { x, y } });
        return;
      }
    }
  };

  const handleMouseMove = (evt) => {
    if (!doc || !dragState) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = evt.clientX - rect.left;
    const y = evt.clientY - rect.top;

    const xRange = bounds.x[1] - bounds.x[0] || 1;
    const zRange = bounds.z[1] - bounds.z[0] || 1;
    const wx = bounds.x[0] + (x / VIEW_WIDTH) * xRange;
    const wz = bounds.z[0] + ((VIEW_HEIGHT - y) / VIEW_HEIGHT) * zRange;

    const newDoc = { ...doc, objects: [...objects] };
    const obj = { ...newDoc.objects[dragState.index] };
    obj.position = { ...(obj.position || { x: 0, y: 0, z: 0 }), x: wx, z: wz };
    newDoc.objects[dragState.index] = obj;

    try {
      onChange(JSON.stringify(newDoc, null, 2));
      setLocalError('');
    } catch (e) {
      setLocalError(e.message);
    }
  };

  const handleMouseUp = () => {
    setDragState(null);
  };

  const disabled = !doc;

  return (
    <div className="bg-gray-800 rounded-lg p-4 flex flex-col h-full">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold">Canvas Editor (Top-Down)</h2>
        
        {/* Clean Object Selector */}
        <div className="flex items-center gap-3">
          <label className="text-sm text-gray-300">Add Object:</label>
          <select
            value={selectedTool}
            onChange={(e) => setSelectedTool(e.target.value)}
            className="bg-gray-700 text-white px-3 py-1 rounded border border-gray-600 text-sm"
            disabled={disabled}
          >
            {OBJECT_CATALOG.map((entry) => (
              <option key={entry.type} value={entry.type}>
                {entry.label}
              </option>
            ))}
          </select>
          
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="px-2 py-1 bg-gray-600 hover:bg-gray-700 rounded text-xs text-gray-300"
          >
            {showAdvanced ? '▼' : '▶'} Advanced
          </button>
        </div>
      </div>

      {localError && (
        <div className="mb-3 p-2 bg-red-900/30 border border-red-700 rounded text-red-300 text-sm">
          {localError}
        </div>
      )}

      {/* Advanced Options (Collapsible) */}
      {showAdvanced && (
        <div className="mb-3 p-3 bg-gray-700 rounded border border-gray-600">
          <h3 className="text-sm font-semibold mb-2 text-gray-300">Quick Add Common Objects</h3>
          <div className="grid grid-cols-3 gap-2">
            {OBJECT_CATALOG.slice(0, 6).map((entry) => (
              <button
                key={`quick-${entry.type}`}
                type="button"
                onClick={() => setSelectedTool(entry.type)}
                className={`px-2 py-1 rounded text-xs border ${
                  selectedTool === entry.type
                    ? 'border-blue-400 bg-blue-600 text-white'
                    : 'border-gray-600 bg-gray-800 text-gray-300'
                }`}
              >
                {entry.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Canvas */}
      <div className="flex-1 flex items-center justify-center">
        <canvas
          ref={canvasRef}
          width={VIEW_WIDTH}
          height={VIEW_HEIGHT}
          className="border border-gray-600 rounded cursor-crosshair"
          onClick={handleCanvasClick}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          style={{ imageRendering: 'pixelated' }}
        />
      </div>

      {/* Instructions */}
      <div className="mt-3 text-xs text-gray-400">
        <p>• Click canvas to add selected object type</p>
        <p>• Drag objects to reposition them</p>
        <p>• Use dropdown to change object type</p>
      </div>
    </div>
  );
}
