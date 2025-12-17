src/App.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Download, RefreshCw, Eye, Code, Grid, Layers, Image as ImageIcon, Copy, Sparkles } from 'lucide-react';
import { OBJECT_TYPES, renderObject } from './objectLibrary';

const UINHybridTool = () => {
  const [activeTab, setActiveTab] = useState('editor');
  const [uinJSON, setUinJSON] = useState(`{
  "version": "0.3",
  "metadata": {
    "description": "Forensische Testszene mit Depth-Map",
    "coordinate_system": "world_space_meters"
  },
  "canvas": {
    "aspect_ratio": "16:9",
    "bounds": {"x": [-4, 4], "y": [0, 4.5], "z": [-2, 6]}
  },
  "global": {
    "lighting": {
      "type": "golden_hour",
      "sun_position": {"azimuth": 285, "elevation": 15}
    }
  },
  "objects": [
    {
      "id": "person1",
      "type": "human",
      "description": "junge Frau, europäisch",
      "position": {"x": 0, "y": 0, "z": 0},
      "rotation": {"y": 15},
      "measurements": {
        "height": {"value": 1.68, "unit": "m"}
      },
      "features": {
        "hair": {"color": {"hex": "#8B0000"}, "length": "long"},
        "eyes": {"color": "blau", "interpupillary_distance": {"value": 63, "unit": "mm"}}
      }
    },
    {
      "id": "tree1",
      "type": "tree",
      "position": {"x": 3, "y": 0, "z": 4},
      "measurements": {"height": {"value": 15, "unit": "m"}}
    }
  ]
}`);
  
  const [svgOutput, setSvgOutput] = useState('');
  const [promptOutput, setPromptOutput] = useState('');
  const [parseError, setParseError] = useState('');
  const [comfyStatus, setComfyStatus] = useState('');
  const canvasRef = useRef(null);

  const rosettaData = [
    {
      concept: "Position (3D)",
      uin: '"position": {"x": 0, "y": 1.7, "z": 0}',
      svg: 'cx="400" cy="411" (2D only)',
      prompt: '"centered, middle ground"',
      forensic: 'Relative Kategorie "mittig"',
      cad: 'translate([0,1.7,0])',
      strength: "UIN: Echte 3D-Koordinaten ★"
    },
    {
      concept: "Augenabstand",
      uin: '"interpupillary_distance": {"value": 63, "unit": "mm"}',
      svg: 'N/A',
      prompt: '"wide-set eyes"',
      forensic: 'FACES Kategorie 4',
      cad: 'N/A',
      strength: "UIN: Präzise Messungen ★"
    },
    {
      concept: "Rotation",
      uin: '"rotation": {"y": 45}',
      svg: 'transform="rotate(45)"',
      prompt: '"facing slightly left"',
      forensic: '"3/4-Ansicht"',
      cad: 'rotate([0,45,0])',
      strength: "UIN: Achsen-präzise ★"
    },
    {
      concept: "Depth (Z-Achse)",
      uin: '"z": 4 (4m entfernt)',
      svg: 'N/A (keine Z-Achse)',
      prompt: '"in the background"',
      forensic: 'N/A',
      cad: 'Z-Koordinate',
      strength: "UIN: Depth-Map generierbar ★"
    },
    {
      concept: "Objekttypen",
      uin: '"type": "car", "building", "dog"',
      svg: 'Manuelle Pfade',
      prompt: '"red car", "tall building"',
      forensic: 'N/A',
      cad: 'Vordefinierte Module',
      strength: "UIN: Erweiterbare Library ★"
    }
  ];

  const generateSVG = (data) => {
    try {
      const parsed = JSON.parse(data);
      const width = 800;
      const height = 450;
      
      const bounds = parsed.canvas?.bounds || {x: [-4, 4], y: [0, 4.5], z: [-2, 6]};
      const xRange = bounds.x[1] - bounds.x[0];
      const yRange = bounds.y[1] - bounds.y[0];
      
      const worldToScreen = (wx, wy) => {
        const sx = ((wx - bounds.x[0]) / xRange) * width;
        const sy = height - ((wy - bounds.y[0]) / yRange) * height;
        return [sx, sy];
      };

      let elements = [];
      
      const bgColor = parsed.global?.lighting?.type === 'golden_hour' ? '#FFD8A8' : '#87CEEB';
      elements.push(`<rect width="${width}" height="${height}" fill="${bgColor}"/>`);
      
      const [gx, gy] = worldToScreen(0, 0);
      elements.push(`<rect x="0" y="${gy}" width="${width}" height="${height - gy}" fill="#228B22"/>`);

      parsed.objects?.forEach(obj => {
        const rendered = renderObject(obj, worldToScreen, yRange, height);
        if (rendered) {
          elements.push(rendered);
        }
      });

      return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  ${elements.join('\n  ')}
</svg>`;
    } catch (e) {
      return `<svg width="800" height="450"><text x="50%" y="50%" text-anchor="middle" fill="red">Parse Error: ${e.message}</text></svg>`;
    }
  };

  const generatePrompt = (data) => {
    try {
      const parsed = JSON.parse(data);
      let parts = [];
      
      if (parsed.global?.lighting?.type) {
        parts.push(`${parsed.global.lighting.type} lighting`);
      }
      
      parsed.objects?.forEach(obj => {
        if (obj.type === 'human') {
          const desc = obj.description || 'person';
          const hair = obj.features?.hair;
          const eyes = obj.features?.eyes;
          
          let personDesc = [desc];
          if (hair?.length) personDesc.push(`${hair.length} hair`);
          if (hair?.color?.hex) personDesc.push('distinctive hair color');
          if (eyes?.color) personDesc.push(`${eyes.color} eyes`);
          
          parts.push(personDesc.join(', '));
        } else if (obj.type === 'tree') {
          parts.push('large tree in background');
        } else if (obj.type === 'car') {
          parts.push('modern car');
        } else if (obj.type === 'building') {
          parts.push('detailed building');
        } else if (obj.type === 'dog') {
          parts.push('friendly dog');
        }
      });
      
      parts.push('highly detailed, photorealistic, cinematic composition, masterpiece');
      
      return parts.join(', ');
    } catch (e) {
      return `Error: ${e.message}`;
    }
  };

  const generateDepthMap = () => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const ctx = canvas.getContext('2d');
    const width = 1024;
    const height = 1024;
    canvas.width = width;
    canvas.height = height;

    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, width, height);

    try {
      const parsed = JSON.parse(uinJSON);
      const bounds = parsed.canvas?.bounds || {x: [-4,4], y: [0,4.5], z: [-2,6]};
      const xRange = bounds.x[1] - bounds.x[0];
      const yRange = bounds.y[1] - bounds.y[0];
      const zRange = bounds.z[1] - bounds.z[0];

      const worldToScreen = (wx, wy, wz) => {
        const sx = ((wx - bounds.x[0]) / xRange) * width;
        const sy = height - ((wy - bounds.y[0]) / yRange) * height;
        const depth = 255 - Math.max(0, Math.min(255, ((wz - bounds.z[0]) / zRange) * 255));
        return [sx, sy, depth];
      };

      parsed.objects?.forEach(obj => {
        const pos = obj.position || {x: 0, y: 0, z: 0};
        const h = obj.measurements?.height?.value || OBJECT_TYPES[obj.type]?.defaultHeight || 1.68;
        const scale = (h / yRange) * height;

        const [sx, sy, depth] = worldToScreen(pos.x, pos.y, pos.z);
        ctx.fillStyle = `rgb(${depth},${depth},${depth})`;
        
        if (obj.type === 'human') {
          ctx.fillRect(sx - scale*0.1, sy - scale, scale*0.2, scale);
        } else if (obj.type === 'tree') {
          ctx.fillRect(sx - scale*0.05, sy - scale*0.3, scale*0.1, scale*0.3);
          ctx.beginPath();
          ctx.arc(sx, sy - scale*0.3, scale*0.15, 0, Math.PI * 2);
          ctx.fill();
        } else if (obj.type === 'car') {
          ctx.fillRect(sx - scale*0.6, sy - scale*0.5, scale*1.2, scale*0.5);
        } else if (obj.type === 'building') {
          ctx.fillRect(sx - scale*0.4, sy - scale, scale*0.8, scale);
        }
      });

      return canvas.toDataURL('image/png');
    } catch (e) {
      console.error('Depth map error:', e);
      return null;
    }
  };

  const downloadDepthMap = () => {
    const dataUrl = generateDepthMap();
    if (dataUrl) {
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = 'uin_depth_map.png';
      a.click();
    }
  };

  const downloadSVG = () => {
    const blob = new Blob([svgOutput], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'uin_output.svg';
    a.click();
  };

  const copyPrompt = () => {
    navigator.clipboard.writeText(promptOutput);
    alert('Prompt kopiert!');
  };

  const generateInComfyUI = async () => {
    try {
      setComfyStatus('⏳ Generiere...');
      const depthMap = generateDepthMap();
      
      const response = await fetch('http://localhost:3001/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: promptOutput,
          depthMapBase64: depthMap,
          workflow: {} // Wird vom Server geladen
        })
      });
      
      const result = await response.json();
      setComfyStatus(result.success ? '✅ Generierung gestartet!' : '❌ Fehler');
    } catch (error) {
      setComfyStatus('❌ ComfyUI Bridge nicht erreichbar. Server gestartet?');
    }
  };

  useEffect(() => {
    try {
      JSON.parse(uinJSON);
      setParseError('');
      setSvgOutput(generateSVG(uinJSON));
      setPromptOutput(generatePrompt(uinJSON));
    } catch (e) {
      setParseError(e.message);
    }
  }, [uinJSON]);

  return (
    <div className="w-full min-h-screen bg-gray-900 text-gray-100 flex flex-col">
      <div className="bg-gray-800 border-b border-gray-700 p-4">
        <h1 className="text-2xl font-bold mb-2">UIN Hybrid-Tool v0.3</h1>
        <p className="text-sm text-gray-400">Universal Image Notation: JSON → SVG → Depth-Map → ComfyUI</p>
      </div>

      <div className="flex bg-gray-800 border-b border-gray-700">
        {[
          { id: 'editor', label: 'Editor + Preview', icon: Code },
          { id: 'rosetta', label: 'Rosetta-Tabelle', icon: Grid },
          { id: 'export', label: 'Export + ComfyUI', icon: Layers }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-6 py-3 border-b-2 transition ${
              activeTab === tab.id
                ? 'border-blue-500 bg-gray-700 text-white'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <tab.icon size={18} />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-auto p-6">
        {activeTab === 'editor' && (
          <div className="grid grid-cols-2 gap-6 h-full">
            <div className="flex flex-col gap-4">
              <div className="bg-gray-800 rounded-lg p-4 flex-1 flex flex-col">
                <div className="flex justify-between items-center mb-3">
                  <h2 className="text-lg font-semibold">UIN Definition (JSON)</h2>
                  <button
                    onClick={() => setUinJSON(uinJSON)}
                    className="p-2 bg-blue-600 hover:bg-blue-700 rounded transition"
                  >
                    <RefreshCw size={16} />
                  </button>
                </div>
                <textarea
                  value={uinJSON}
                  onChange={(e) => setUinJSON(e.target.value)}
                  className="flex-1 bg-gray-900 text-green-400 font-mono text-sm p-3 rounded border border-gray-700 resize-none"
                  spellCheck={false}
                />
                {parseError && (
                  <div className="mt-2 p-2 bg-red-900/30 border border-red-700 rounded text-red-300 text-sm">
                    Parse Error: {parseError}
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <div className="bg-gray-800 rounded-lg p-4">
                <div className="flex justify-between items-center mb-3">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <Eye size={18} />
                    SVG Preview (Ground Truth)
                  </h2>
                  <button
                    onClick={downloadSVG}
                    className="p-2 bg-green-600 hover:bg-green-700 rounded transition flex items-center gap-2"
                  >
                    <Download size={16} />
                  </button>
                </div>
                <div className="bg-white rounded p-2" dangerouslySetInnerHTML={{ __html: svgOutput }} />
              </div>

              <div className="bg-gray-800 rounded-lg p-4">
                <h2 className="text-lg font-semibold mb-3">Generated Prompt (T2I)</h2>
                <div className="bg-gray-900 p-3 rounded border border-gray-700 text-sm mb-2">
                  {promptOutput}
                </div>
                <button
                  onClick={copyPrompt}
                  className="px-3 py-1 bg-purple-600 hover:bg-purple-700 rounded text-sm transition flex items-center gap-2"
                >
                  <Copy size={14} />
                  Copy Prompt
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'rosetta' && (
          <div>
            <h2 className="text-2xl font-bold mb-4">Rosetta-Tabelle: System-Vergleich</h2>
            <div className="overflow-x-auto">
              <table className="w-full bg-gray-800 rounded-lg overflow-hidden">
                <thead className="bg-gray-700">
                  <tr>
                    <th className="p-3 text-left">Konzept</th>
                    <th className="p-3 text-left">UIN</th>
                    <th className="p-3 text-left">SVG</th>
                    <th className="p-3 text-left">Prompt</th>
                    <th className="p-3 text-left">Forensik</th>
                    <th className="p-3 text-left">CAD</th>
                    <th className="p-3 text-left">Stärke</th>
                  </tr>
                </thead>
                <tbody>
                  {rosettaData.map((row, i) => (
                    <tr key={i} className="border-t border-gray-700 hover:bg-gray-750">
                      <td className="p-3 font-semibold">{row.concept}</td>
                      <td className="p-3 font-mono text-xs text-green-400">{row.uin}</td>
                      <td className="p-3 font-mono text-xs text-blue-400">{row.svg}</td>
                      <td className="p-3 font-mono text-xs text-purple-400">{row.prompt}</td>
                      <td className="p-3 text-xs text-yellow-400">{row.forensic}</td>
                      <td className="p-3 font-mono text-xs text-cyan-400">{row.cad}</td>
                      <td className="p-3 text-xs text-gray-300">{row.strength}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-6 p-4 bg-blue-900/30 border border-blue-700 rounded">
              <h3 className="font-semibold mb-2">Lückenanalyse v0.3</h3>
              <ul className="text-sm space-y-1 text-gray-300">
                <li>✓ UIN kombiniert CAD-Präzision mit Prompt-Semantik</li>
                <li>✓ Z-Achse → automatische Depth-Map für ControlNet</li>
                <li>✓ Erweiterbare Objekt-Library (Auto, Gebäude, Tiere)</li>
                <li>⚠ Forensik-Systeme zu kategorisch → UIN revolutioniert</li>
                <li>⚠ SVG fehlt Z-Achse → UIN ergänzt</li>
              </ul>
            </div>
          </div>
        )}

        {activeTab === 'export' && (
          <div className="space-y-6">
            <div className="bg-gray-800 rounded-lg p-4">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <ImageIcon size={20} />
                Depth-Map Export (für ComfyUI ControlNet)
              </h2>
              <canvas ref={canvasRef} style={{display: 'none'}} />
              <p className="text-sm text-gray-400 mb-4">
                Automatisch aus Z-Koordinaten generiert. Nahe Objekte = hell, ferne = dunkel.
              </p>
              <button
                onClick={downloadDepthMap}
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 rounded flex items-center gap-2 transition"
              >
                <Download size={18} />
                Depth-Map PNG herunterladen (1024x1024)
              </button>
            </div>

            <div className="bg-gray-800 rounded-lg p-4">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Sparkles size={20} />
                ComfyUI One-Click Generation
              </h2>
              <p className="text-sm text-gray-400 mb-4">
                Bridge-Server muss laufen: <code className="bg-gray-900 px-2 py-1 rounded">cd server && npm start</code>
              </p>
              <button
                onClick={generateInComfyUI}
                className="px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded flex items-center gap-2 transition mb-2"
              >
                <Sparkles size={18} />
                In ComfyUI generieren
              </button>
              {comfyStatus && (
                <div className="p-2 bg-gray-900 rounded text-sm">{comfyStatus}</div>
              )}
            </div>

            <div className="bg-gray-800 rounded-lg p-4">
              <h2 className="text-xl font-semibold mb-4">ComfyUI Workflow (Manuell)</h2>
              <ol className="text-sm space-y-2 text-gray-300">
                <li><strong>1.</strong> Depth-Map PNG oben herunterladen</li>
                <li><strong>2.</strong> ComfyUI öffnen → <code className="bg-gray-900 px-2 py-1 rounded">workflows/comfyui-uin-basic.json</code> laden</li>
                <li><strong>3.</strong> PNG in LoadImage-Node ziehen</li>
                <li><strong>4.</strong> Prompt aus "Editor + Preview" Tab kopieren</li>
                <li><strong>5.</strong> Queue Prompt → Generierung läuft!</li>
              </ol>
            </div>

            <div className="bg-gray-800 rounded-lg p-4">
              <h2 className="text-xl font-semibold mb-4">Python-API Beispiel</h2>
              <pre className="bg-gray-900 p-3 rounded text-xs overflow-auto text-green-400">
{`import json, requests

# 1. Load workflow
workflow = json.load(open("workflows/comfyui-uin-basic.json"))

# 2. Set prompt
workflow["6"]["inputs"]["text"] = "${promptOutput}"

# 3. Upload depth map (see comfyui-uin-api-example.py)

# 4. Queue
response = requests.post(
    "http://127.0.0.1:8188/prompt",
    json={"prompt": workflow}
)
print("Generierung gestartet:", response.json())`}
              </pre>
            </div>
          </div>
        )}
      </div>

      <div className="bg-gray-800 border-t border-gray-700 p-3 text-center text-sm text-gray-400">
        UIN v0.3 | MIT License | <a href="https://github.com/z3uss3l/uin-ngin" className="text-blue-400 hover:underline">GitHub</a>
      </div>
    </div>
  );
};

export default UINHybridTool;
