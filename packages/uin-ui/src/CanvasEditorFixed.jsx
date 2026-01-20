import React, { useEffect, useRef, useState } from 'react';
import { OBJECT_CATALOG } from './objectCatalog';

const VIEW_WIDTH = 600;
const VIEW_HEIGHT = 400;

function worldToScreen(pos, bounds) {
  const xRange = bounds.x[1] - bounds.x[0] || 1;
  const yRange = bounds.y[1] - bounds.y[0] || 1;
  const sx = ((pos.x - bounds.x[0]) / xRange) * VIEW_WIDTH;
  const sy = VIEW_HEIGHT - ((pos.y - bounds.y[0]) / yRange) * VIEW_HEIGHT;
  return { x: sx, y: sy };
}

export default function CanvasEditorFixed({ uinJSON, onChange }) {
  const canvasRef = useRef(null);
  const [selectedType, setSelectedType] = useState('human');
  const [position, setPosition] = useState({ x: 0, y: 0, z: 0 });
  const [localError, setLocalError] = useState('');
  const [selectedObjectIndex, setSelectedObjectIndex] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Load saved state on mount
  useEffect(() => {
    const savedState = localStorage.getItem('uinCanvasState');
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        if (parsed.objects && Array.isArray(parsed.objects)) {
          // Merge saved objects with current document
          const currentDoc = JSON.parse(uinJSON || '{}');
          const mergedDoc = {
            ...currentDoc,
            objects: parsed.objects
          };
          onChange(JSON.stringify(mergedDoc, null, 2));
        }
      } catch (e) {
        console.error('Failed to load saved state:', e);
      }
    }
  }, [onChange]);

  // Save state to localStorage whenever it changes
  useEffect(() => {
    const doc = JSON.parse(uinJSON || '{}');
    if (doc && doc.objects) {
      const stateToSave = {
        objects: doc.objects,
        timestamp: new Date().toISOString()
      };
      localStorage.setItem('uinCanvasState', JSON.stringify(stateToSave));
    }
  }, [uinJSON]);

  // Safe parsing with error handling
  let doc = null;
  let objects = [];
  
  try {
    doc = JSON.parse(uinJSON || '{}');
    objects = Array.isArray(doc?.objects) ? doc.objects : [];
  } catch (e) {
    console.error('JSON parsing error:', e);
    doc = null;
    objects = [];
  }

  const bounds = doc?.canvas?.bounds || { x: [-10, 10], y: [-10, 10], z: [-5, 5] };

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
          const { x: objX, y: objY } = worldToScreen(obj.position, bounds);
          setDragOffset({ x: x - objX, y: y - objY });  
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
    const yRange = bounds.y[1] - bounds.y[0] || 1;
    const worldX = bounds.x[0] + (x / VIEW_WIDTH) * xRange;
    const worldY = bounds.y[0] + ((VIEW_HEIGHT - y) / VIEW_HEIGHT) * yRange;

    const newDoc = { ...doc, objects: [...objects] };
    const obj = { ...newDoc.objects[selectedObjectIndex] };
    obj.position = { 
      ...(obj.position || { x: 0, y: 0, z: 0 }), 
      x: worldX + dragOffset.x, 
      y: worldY + dragOffset.y
    };
    newDoc.objects[selectedObjectIndex] = obj;

    try {
      onChange(JSON.stringify(newDoc, null, 2));
      setLocalError('');
    } catch (e) {
      setLocalError(e.message);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleClear = () => {
    if (!doc) return;
    
    const clearedDoc = {
      ...doc,
      objects: []
    };
    
    try {
      onChange(JSON.stringify(clearedDoc, null, 2));
      setLocalError('');
      setSelectedObjectIndex(null);
    } catch (e) {
      setLocalError(e.message);
    }
  };

  const handleDelete = () => {
    if (selectedObjectIndex === null) return;
    
    const newDoc = { ...doc, objects: [...objects] };
    newDoc.objects.splice(selectedObjectIndex, 1);
    setSelectedObjectIndex(null);
    
    try {
      onChange(JSON.stringify(newDoc, null, 2));
      setLocalError('');
    } catch (e) {
      setLocalError(e.message);
    }
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
    try {
      onChange(JSON.stringify(newDoc, null, 2));
      setLocalError('');
    } catch (e) {
      setLocalError(e.message);
    }
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
  }, [selectedObjectIndex, handleDelete]);

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

      {/* Controls */}
      <div className="mt-3 flex items-center justify-between">
        <div className="text-xs text-gray-400">
          <p>• Click object to select, drag to move</p>
          <p>• Press Delete key to remove selected object</p>
          <p>• Clear All button removes all objects</p>
          <p>• Objects persist in browser session</p>
        </div>
        
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
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={handleDelete}
                className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm"
              >
                Delete
              </button>
              <select
                value={objects[selectedObjectIndex]?.type || 'human'}
                onChange={(e) => {
                  const newDoc = { ...doc, objects: [...objects] };
                  newDoc.objects[selectedObjectIndex] = {
                    ...newDoc.objects[selectedObjectIndex],
                    type: e.target.value
                  };
                  onChange(JSON.stringify(newDoc, null, 2));
                }}
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
        )}
      </div>
    </div>
  );
}
