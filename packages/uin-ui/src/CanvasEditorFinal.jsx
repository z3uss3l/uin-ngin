import React, { useEffect, useRef, useState } from 'react';
import { OBJECT_CATALOG } from './objectCatalog';

const VIEW_WIDTH = 600;
const VIEW_HEIGHT = 400;

function worldToScreen(pos, bounds) {
  const xRange = bounds.x[1] - bounds.x[0] || 1;
  const zRange = bounds.z[1] - bounds.z[0] || 1;
  const sx = ((pos.x - bounds.x[0]) / xRange) * VIEW_WIDTH;
  const sy = VIEW_HEIGHT - ((pos.z - bounds.z[0]) / zRange) * VIEW_HEIGHT;
  return { x: sx, y: sy };
}

export default function CanvasEditorFinal({ uinJSON, onChange }) {
  const canvasRef = useRef(null);
  const [selectedType, setSelectedType] = useState('human');
  const [position, setPosition] = useState({ x: 0, y: 0, z: 0 });
  const [localError, setLocalError] = useState('');
  const [selectedObjectIndex, setSelectedObjectIndex] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Safe parsing with error handling
  let doc = null;
  let objects = [];
  
  try {
    doc = JSON.parse(uinJSON || '{}');
    objects = Array.isArray(doc?.objects) ? [...doc.objects] : [];
  } catch (e) {
    console.error('JSON parsing error:', e);
    doc = { objects: [] };
    objects = [];
  }

  const bounds = doc?.canvas?.bounds || { x: [-10, 10], y: [-10, 10], z: [-5, 5] };

  // Debug logging
  console.log('Bounds:', bounds);
  console.log('Bounds X:', bounds.x, 'Bounds Z:', bounds.z);

  // Load saved state on mount
  useEffect(() => {
    const savedState = localStorage.getItem('uinCanvasState');
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        if (parsed.objects && Array.isArray(parsed.objects)) {
          // Restore saved objects
          objects = [...parsed.objects];
          const restoredDoc = { ...doc, objects };
          onChange(JSON.stringify(restoredDoc, null, 2));
        }
      } catch (e) {
        console.error('Failed to load saved state:', e);
      }
    }
  }, []);

  // Save state to localStorage whenever it changes
  useEffect(() => {
    if (doc && objects.length > 0) {
      const stateToSave = {
        objects: objects,
        timestamp: new Date().toISOString()
      };
      localStorage.setItem('uinCanvasState', JSON.stringify(stateToSave));
    }
  }, [objects]);

  // Rendering
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
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
    objects.forEach((obj, index) => {
      if (!obj.position) return;
      const { x, y } = worldToScreen(obj.position, bounds);
      const spec = OBJECT_CATALOG.find(entry => entry.type === obj.type) || {};
      const color = spec.color || '#22c55e';
      
      // Draw object
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x, y, 10, 0, Math.PI * 2);
      ctx.fill();

      // Highlight selected object
      if (index === selectedObjectIndex) {
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(x, y, 12, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Label
      ctx.fillStyle = '#e5e7eb';
      ctx.font = '10px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText(obj.type || '?', x, y - 14);
    });

    // Preview object at current position
    const { x: px, y: py } = worldToScreen(position, bounds);
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(px, py, 10, 0, Math.PI * 2);
    ctx.stroke();
  }, [uinJSON, position, selectedObjectIndex]);

  const handleCanvasClick = (evt) => {
    if (!doc) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = evt.clientX - rect.left;
    const y = evt.clientY - rect.top;

    // Check if clicking on existing object
    for (let i = objects.length - 1; i >= 0; i -= 1) {
      const obj = objects[i];
      if (obj.position) {
        const { x: objX, y: objY } = worldToScreen(obj.position, bounds);
        const distance = Math.sqrt((x - objX) ** 2 + (y - objY) ** 2);
        
        if (distance <= 12) {
          setSelectedObjectIndex(i);
          return;
        }
      }
    }
    
    // Clicked on empty space - deselect
    setSelectedObjectIndex(null);
  };

  const handleMouseDown = (evt) => {
    if (!doc) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = evt.clientX - rect.left;
    const y = evt.clientY - rect.top;

    // Check if clicking on existing object for dragging
    for (let i = objects.length - 1; i >= 0; i -= 1) {
      const obj = objects[i];
      if (obj.position) {
        const { x: objX, y: objY } = worldToScreen(obj.position, bounds);
        const distance = Math.sqrt((x - objX) ** 2 + (y - objY) ** 2);
        
        if (distance <= 12) {
          setSelectedObjectIndex(i);
          setIsDragging(true);
          const { x: worldX, z: worldZ } = worldToScreen(obj.position, bounds);
          const screenX = x - rect.left;
          const screenY = y - rect.top;
          const canvasX = screenX - VIEW_WIDTH / 2;
          const canvasY = VIEW_HEIGHT / 2 - screenY;
          const worldXCoord = bounds.x[0] + (canvasX / VIEW_WIDTH) * (bounds.x[1] - bounds.x[0]);
          const worldZCoord = bounds.z[0] + (canvasY / VIEW_HEIGHT) * (bounds.z[1] - bounds.z[0]);
          setDragOffset({ x: x - worldXCoord, y: y - worldZCoord });
          return;
        }
      }
    }
  };

  const handleMouseMove = (evt) => {
    if (!doc || !isDragging || selectedObjectIndex === null) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = evt.clientX - rect.left;
    const y = evt.clientY - rect.top;

    // Convert screen to world coordinates
    const xRange = bounds.x[1] - bounds.x[0] || 1;
    const zRange = bounds.z[1] - bounds.z[0] || 1;
    const worldX = bounds.x[0] + (x / VIEW_WIDTH) * xRange;
    const worldZ = bounds.z[0] + ((VIEW_HEIGHT - y) / VIEW_HEIGHT) * zRange;

    // Debug logging
    console.log('Mouse move:', { x, y }, 'World:', { worldX, worldZ });

    const newDoc = { ...doc, objects: [...objects] };
    const obj = { ...newDoc.objects[selectedObjectIndex] };
    obj.position = { 
      ...(obj.position || { x: 0, y: 0, z: 0 }), 
      x: worldX + dragOffset.x, 
      z: worldZ + dragOffset.y
    };
    newDoc.objects[selectedObjectIndex] = obj;

    // Update both objects array and trigger onChange
    const updatedObjects = [...newDoc.objects];
    onChange(JSON.stringify({ ...doc, objects: updatedObjects }, null, 2));
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleDelete = () => {
    if (selectedObjectIndex === null) return;
    
    const newDoc = { ...doc, objects: [...objects] };
    newDoc.objects.splice(selectedObjectIndex, 1);
    setSelectedObjectIndex(null);
    
    onChange(JSON.stringify(newDoc, null, 2));
  };

  const handleAddObject = () => {
    if (!doc) return;

    const newDoc = { ...doc, objects: [...objects] };
    const idSuffix = objects.length + 1;

    const newObject = {
      id: `${selectedType}${idSuffix}`,
      type: selectedType,
      position: { ...position }
    };

    newDoc.objects.push(newObject);
    onChange(JSON.stringify(newDoc, null, 2));
  };

  const handleClear = () => {
    if (!doc) return;
    
    const clearedDoc = { ...doc, objects: [] };
    onChange(JSON.stringify(clearedDoc, null, 2));
    setSelectedObjectIndex(null);
  };

  const handleTypeChange = (newType) => {
    if (selectedObjectIndex === null) return;
    
    const newDoc = { ...doc, objects: [...objects] };
    newDoc.objects[selectedObjectIndex] = {
      ...newDoc.objects[selectedObjectIndex],
      type: newType
    };
    
    onChange(JSON.stringify(newDoc, null, 2));
  };

  // Keyboard event handler
  useEffect(() => {
    const handleKeyDown = (evt) => {
      if (evt.key === 'Delete' && selectedObjectIndex !== null) {
        handleDelete();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedObjectIndex, handleDelete, handleTypeChange]);

  const disabled = !doc;

  return (
    <div className="bg-gray-800 rounded-lg p-4 flex flex-col h-full">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold">Canvas Editor</h2>
      </div>

      {localError && (
        <div className="mb-3 p-2 bg-red-900/30 border border-red-700 rounded text-red-300 text-sm">
          {localError}
        </div>
      )}

      {/* Control Panel */}
      <div className="mb-4 p-3 bg-gray-700 rounded border border-gray-600">
        <div className="grid grid-cols-2 gap-4">
          {/* Object Type */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Object Type
            </label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full bg-gray-600 text-white px-2 py-1 rounded border border-gray-500 text-sm"
              disabled={disabled}
            >
              {OBJECT_CATALOG.map((entry) => (
                <option key={entry.type} value={entry.type}>
                  {entry.label}
                </option>
              ))}
            </select>
          </div>

          {/* Action Buttons */}
          <div className="flex items-end gap-2">
            <button
              onClick={handleAddObject}
              disabled={disabled}
              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded text-sm font-medium"
            >
              Add Object
            </button>
            <button
              onClick={handleClear}
              disabled={disabled}
              className="px-3 py-1 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-600 text-white rounded text-sm font-medium"
            >
              Clear All
            </button>
          </div>
        </div>

        {/* Position Controls */}
        <div className="mt-3">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Position (X, Y, Z)
          </label>
          <div className="grid grid-cols-3 gap-2">
            <input
              type="number"
              value={selectedObjectIndex !== null ? objects[selectedObjectIndex]?.position?.x || 0 : 0}
              onChange={(e) => {
                if (selectedObjectIndex !== null) {
                  const newDoc = { ...doc, objects: [...objects] };
                  newDoc.objects[selectedObjectIndex] = {
                    ...newDoc.objects[selectedObjectIndex],
                    position: {
                      ...newDoc.objects[selectedObjectIndex].position,
                      x: parseFloat(e.target.value) || 0
                    }
                  };
                  onChange(JSON.stringify(newDoc, null, 2));
                }
              }}
              className="bg-gray-600 text-white px-2 py-1 rounded border border-gray-500 text-sm"
              placeholder="X"
              disabled={selectedObjectIndex === null}
            />
            <input
              type="number"
              value={selectedObjectIndex !== null ? objects[selectedObjectIndex]?.position?.y || 0 : 0}
              onChange={(e) => {
                if (selectedObjectIndex !== null) {
                  const newDoc = { ...doc, objects: [...objects] };
                  newDoc.objects[selectedObjectIndex] = {
                    ...newDoc.objects[selectedObjectIndex],
                    position: {
                      ...newDoc.objects[selectedObjectIndex].position,
                      y: parseFloat(e.target.value) || 0
                    }
                  };
                  onChange(JSON.stringify(newDoc, null, 2));
                }
              }}
              className="bg-gray-600 text-white px-2 py-1 rounded border border-gray-500 text-sm"
              placeholder="Y"
              disabled={selectedObjectIndex === null}
            />
            <input
              type="number"
              value={selectedObjectIndex !== null ? objects[selectedObjectIndex]?.position?.z || 0 : 0}
              onChange={(e) => {
                if (selectedObjectIndex !== null) {
                  const newDoc = { ...doc, objects: [...objects] };
                  newDoc.objects[selectedObjectIndex] = {
                    ...newDoc.objects[selectedObjectIndex],
                    position: {
                      ...newDoc.objects[selectedObjectIndex].position,
                      z: parseFloat(e.target.value) || 0
                    }
                  };
                  onChange(JSON.stringify(newDoc, null, 2));
                }
              }}
              className="bg-gray-600 text-white px-2 py-1 rounded border border-gray-500 text-sm"
              placeholder="Z"
              disabled={selectedObjectIndex === null}
            />
          </div>
        </div>
      </div>

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

      {/* Object Info Panel */}
      {selectedObjectIndex !== null && (
        <div className="bg-gray-700 rounded p-3 mb-3">
          <h4 className="text-sm font-semibold text-blue-400 mb-2">
            Object: {objects[selectedObjectIndex]?.type || 'Unknown'}
          </h4>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-gray-400">ID:</span>
              <span className="text-white ml-1">{objects[selectedObjectIndex]?.id || 'N/A'}</span>
            </div>
            <div>
              <span className="text-gray-400">Type:</span>
              <span className="text-white ml-1">{objects[selectedObjectIndex]?.type || 'N/A'}</span>
            </div>
            <div>
              <span className="text-gray-400">Position:</span>
              <span className="text-white ml-1">
                X: {objects[selectedObjectIndex]?.position?.x?.toFixed(1) || '0'}, 
                Y: {objects[selectedObjectIndex]?.position?.y?.toFixed(1) || '0'}, 
                Z: {objects[selectedObjectIndex]?.position?.z?.toFixed(1) || '0'}
              </span>
            </div>
            <div className="col-span-2">
              <span className="text-gray-400">Change Type:</span>
              <select
                value={objects[selectedObjectIndex]?.type || 'human'}
                onChange={(e) => handleTypeChange(e.target.value)}
                className="bg-gray-600 text-white px-2 py-1 rounded border border-gray-500 text-sm"
              >
                {OBJECT_CATALOG.map((entry) => (
                  <option key={entry.type} value={entry.type}>
                    {entry.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="mt-3 text-xs text-gray-400">
        <p>• Click object to select, drag to move</p>
        <p>• Press Delete key to remove selected object</p>
        <p>• Clear All button removes all objects</p>
        <p>• Objects persist in browser session</p>
      </div>
    </div>
  );
}
