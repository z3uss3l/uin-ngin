import React, { useState, useEffect } from 'react';
import { Download, RefreshCw, Eye, Code, Grid, Layers, Copy } from 'lucide-react';
import { UINParser, validateUIN } from '@uin/core';
import { toSVG, toDepthMap, toPrompt } from '@uin/adapters';

const UINHybridTool = () => {
  const [activeTab, setActiveTab] = useState('editor');
  const [uinJSON, setUinJSON] = useState(`{
  "version": "0.3",
  "metadata": {
    "description": "Demo scene"
  },
  "canvas": {
    "aspect_ratio": "16:9",
    "bounds": {"x": [-4, 4], "y": [0, 4.5], "z": [-2, 6]}
  },
  "global": {
    "lighting": {
      "type": "golden_hour"
    }
  },
  "objects": [
    {
      "id": "person1",
      "type": "human",
      "description": "young woman",
      "position": {"x": 0, "y": 0, "z": 0},
      "measurements": {
        "height": {"value": 1.68, "unit": "m"}
      },
      "features": {
        "hair": {"color": {"hex": "#8B0000"}, "length": "long"},
        "eyes": {"color": "blue"}
      }
    },
    {
      "id": "tree1",
      "type": "tree",
      "position": {"x": 3, "y": 0, "z": 4}
    }
  ]
}`);
  
  const [svgOutput, setSvgOutput] = useState('');
  const [promptOutput, setPromptOutput] = useState('');
  const [parseError, setParseError] = useState('');
  const [depthMapDataURL, setDepthMapDataURL] = useState('');

  const rosettaData = [
    {
      concept: "Position (3D)",
      uin: '"position": {"x": 0, "y": 1.7, "z": 0}',
      svg: 'cx="400" cy="411" (2D)',
      prompt: '"centered, middle ground"',
      forensic: 'Kategorie "mittig"',
      cad: 'translate([0,1.7,0])',
      strength: "UIN: 3D-Koordinaten ★"
    },
    {
      concept: "Depth (Z-Achse)",
      uin: '"z": 4',
      svg: 'N/A',
      prompt: '"in background"',
      forensic: 'N/A',
      cad: 'Z-Koordinate',
      strength: "UIN: Depth-Map ★"
    }
  ];

  // Generate outputs when JSON changes
  useEffect(() => {
    try {
      const parsed = JSON.parse(uinJSON);
      validateUIN(parsed);
      setParseError('');
      
      // Generate SVG
      setSvgOutput(toSVG(parsed, { validate: false }));
      
      // Generate Prompt
      setPromptOutput(toPrompt(parsed, { validate: false }));
      
      // Generate Depth Map (async)
      toDepthMap(parsed, { validate: false }).then(dataURL => {
        setDepthMapDataURL(dataURL);
      });
      
    } catch (e) {
      setParseError(e.message);
      setSvgOutput('');
      setPromptOutput('');
    }
  }, [uinJSON]);

  const downloadSVG = () => {
    const blob = new Blob([svgOutput], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'uin_output.svg';
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadDepthMap = () => {
    const a = document.createElement('a');
    a.href = depthMapDataURL;
    a.download = 'uin_depth_map.png';
    a.click();
  };

  const copyPrompt = () => {
    navigator.clipboard.writeText(promptOutput);
    alert('Prompt copied!');
  };

  return (
    <div className="w-full min-h-screen bg-gray-900 text-gray-100 flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 p-4">
        <h1 className="text-2xl font-bold mb-2">UIN Tool v0.3</h1>
        <p className="text-sm text-gray-400">Universal Image Notation - Engine-powered</p>
      </div>

      {/* Tabs */}
      <div className="flex bg-gray-800 border-b border-gray-700">
        {[
          { id: 'editor', label: 'Editor + Preview', icon: Code },
          { id: 'rosetta', label: 'Rosetta Table', icon: Grid },
          { id: 'export', label: 'Export', icon: Layers }
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

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {activeTab === 'editor' && (
          <div className="grid grid-cols-2 gap-6 h-full">
            {/* Left: JSON Editor */}
            <div className="flex flex-col gap-4">
              <div className="bg-gray-800 rounded-lg p-4 flex-1 flex flex-col">
                <div className="flex justify-between items-center mb-3">
                  <h2 className="text-lg font-semibold">UIN Definition</h2>
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
                    {parseError}
                  </div>
                )}
              </div>
            </div>

            {/* Right: Outputs */}
            <div className="flex flex-col gap-4">
              {/* SVG Preview */}
              <div className="bg-gray-800 rounded-lg p-4">
                <div className="flex justify-between items-center mb-3">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <Eye size={18} />
                    SVG Preview
                  </h2>
                  <button
                    onClick={downloadSVG}
                    className="p-2 bg-green-600 hover:bg-green-700 rounded transition"
                  >
                    <Download size={16} />
                  </button>
                </div>
                <div 
                  className="bg-white rounded p-2" 
                  dangerouslySetInnerHTML={{ __html: svgOutput }} 
                />
              </div>

              {/* Prompt */}
              <div className="bg-gray-800 rounded-lg p-4">
                <h2 className="text-lg font-semibold mb-3">Generated Prompt</h2>
                <div className="bg-gray-900 p-3 rounded border border-gray-700 text-sm mb-2">
                  {promptOutput}
                </div>
                <button
                  onClick={copyPrompt}
                  className="px-3 py-1 bg-purple-600 hover:bg-purple-700 rounded text-sm transition flex items-center gap-2"
                >
                  <Copy size={14} />
                  Copy
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'rosetta' && (
          <div>
            <h2 className="text-2xl font-bold mb-4">Rosetta Table</h2>
            <div className="overflow-x-auto">
              <table className="w-full bg-gray-800 rounded-lg overflow-hidden">
                <thead className="bg-gray-700">
                  <tr>
                    <th className="p-3 text-left">Concept</th>
                    <th className="p-3 text-left">UIN</th>
                    <th className="p-3 text-left">SVG</th>
                    <th className="p-3 text-left">Prompt</th>
                    <th className="p-3 text-left">Forensic</th>
                    <th className="p-3 text-left">CAD</th>
                    <th className="p-3 text-left">Strength</th>
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
          </div>
        )}

        {activeTab === 'export' && (
          <div className="space-y-6">
            {/* Depth Map */}
            <div className="bg-gray-800 rounded-lg p-4">
              <h2 className="text-xl font-semibold mb-4">Depth Map (ControlNet)</h2>
              {depthMapDataURL && (
                <div className="mb-4">
                  <img src={depthMapDataURL} alt="Depth Map" className="max-w-md border border-gray-700 rounded" />
                </div>
              )}
              <button
                onClick={downloadDepthMap}
                disabled={!depthMapDataURL}
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-600 rounded flex items-center gap-2 transition"
              >
                <Download size={18} />
                Download Depth Map
              </button>
            </div>

            {/* CLI Info */}
            <div className="bg-gray-800 rounded-lg p-4">
              <h2 className="text-xl font-semibold mb-4">CLI Usage</h2>
              <pre className="bg-gray-900 p-3 rounded text-xs overflow-auto text-green-400">
{`# Render to SVG
uin render scene.json -o output.svg

# Generate depth map
uin depth scene.json -o depth.png

# Generate prompt
uin prompt scene.json

# Generate ComfyUI workflow
uin comfyui scene.json -o workflow.json`}
              </pre>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="bg-gray-800 border-t border-gray-700 p-3 text-center text-sm text-gray-400">
        UIN Engine v0.3 | Powered by @uin/core + @uin/adapters
      </div>
    </div>
  );
};

export default UINHybridTool;import React, { useState, useEffect } from 'react';
import { Download, RefreshCw, Eye, Code, Grid, Layers, Copy } from 'lucide-react';
import { UINParser, validateUIN } from '@uin/core';
import { toSVG, toDepthMap, toPrompt } from '@uin/adapters';

const UINHybridTool = () => {
  const [activeTab, setActiveTab] = useState('editor');
  const [uinJSON, setUinJSON] = useState(`{
  "version": "0.3",
  "metadata": {
    "description": "Demo scene"
  },
  "canvas": {
    "aspect_ratio": "16:9",
    "bounds": {"x": [-4, 4], "y": [0, 4.5], "z": [-2, 6]}
  },
  "global": {
    "lighting": {
      "type": "golden_hour"
    }
  },
  "objects": [
    {
      "id": "person1",
      "type": "human",
      "description": "young woman",
      "position": {"x": 0, "y": 0, "z": 0},
      "measurements": {
        "height": {"value": 1.68, "unit": "m"}
      },
      "features": {
        "hair": {"color": {"hex": "#8B0000"}, "length": "long"},
        "eyes": {"color": "blue"}
      }
    },
    {
      "id": "tree1",
      "type": "tree",
      "position": {"x": 3, "y": 0, "z": 4}
    }
  ]
}`);
  
  const [svgOutput, setSvgOutput] = useState('');
  const [promptOutput, setPromptOutput] = useState('');
  const [parseError, setParseError] = useState('');
  const [depthMapDataURL, setDepthMapDataURL] = useState('');

  const rosettaData = [
    {
      concept: "Position (3D)",
      uin: '"position": {"x": 0, "y": 1.7, "z": 0}',
      svg: 'cx="400" cy="411" (2D)',
      prompt: '"centered, middle ground"',
      forensic: 'Kategorie "mittig"',
      cad: 'translate([0,1.7,0])',
      strength: "UIN: 3D-Koordinaten ★"
    },
    {
      concept: "Depth (Z-Achse)",
      uin: '"z": 4',
      svg: 'N/A',
      prompt: '"in background"',
      forensic: 'N/A',
      cad: 'Z-Koordinate',
      strength: "UIN: Depth-Map ★"
    }
  ];

  // Generate outputs when JSON changes
  useEffect(() => {
    try {
      const parsed = JSON.parse(uinJSON);
      validateUIN(parsed);
      setParseError('');
      
      // Generate SVG
      setSvgOutput(toSVG(parsed, { validate: false }));
      
      // Generate Prompt
      setPromptOutput(toPrompt(parsed, { validate: false }));
      
      // Generate Depth Map (async)
      toDepthMap(parsed, { validate: false }).then(dataURL => {
        setDepthMapDataURL(dataURL);
      });
      
    } catch (e) {
      setParseError(e.message);
      setSvgOutput('');
      setPromptOutput('');
    }
  }, [uinJSON]);

  const downloadSVG = () => {
    const blob = new Blob([svgOutput], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'uin_output.svg';
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadDepthMap = () => {
    const a = document.createElement('a');
    a.href = depthMapDataURL;
    a.download = 'uin_depth_map.png';
    a.click();
  };

  const copyPrompt = () => {
    navigator.clipboard.writeText(promptOutput);
    alert('Prompt copied!');
  };

  return (
    <div className="w-full min-h-screen bg-gray-900 text-gray-100 flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 p-4">
        <h1 className="text-2xl font-bold mb-2">UIN Tool v0.3</h1>
        <p className="text-sm text-gray-400">Universal Image Notation - Engine-powered</p>
      </div>

      {/* Tabs */}
      <div className="flex bg-gray-800 border-b border-gray-700">
        {[
          { id: 'editor', label: 'Editor + Preview', icon: Code },
          { id: 'rosetta', label: 'Rosetta Table', icon: Grid },
          { id: 'export', label: 'Export', icon: Layers }
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

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {activeTab === 'editor' && (
          <div className="grid grid-cols-2 gap-6 h-full">
            {/* Left: JSON Editor */}
            <div className="flex flex-col gap-4">
              <div className="bg-gray-800 rounded-lg p-4 flex-1 flex flex-col">
                <div className="flex justify-between items-center mb-3">
                  <h2 className="text-lg font-semibold">UIN Definition</h2>
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
                    {parseError}
                  </div>
                )}
              </div>
            </div>

            {/* Right: Outputs */}
            <div className="flex flex-col gap-4">
              {/* SVG Preview */}
              <div className="bg-gray-800 rounded-lg p-4">
                <div className="flex justify-between items-center mb-3">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <Eye size={18} />
                    SVG Preview
                  </h2>
                  <button
                    onClick={downloadSVG}
                    className="p-2 bg-green-600 hover:bg-green-700 rounded transition"
                  >
                    <Download size={16} />
                  </button>
                </div>
                <div 
                  className="bg-white rounded p-2" 
                  dangerouslySetInnerHTML={{ __html: svgOutput }} 
                />
              </div>

              {/* Prompt */}
              <div className="bg-gray-800 rounded-lg p-4">
                <h2 className="text-lg font-semibold mb-3">Generated Prompt</h2>
                <div className="bg-gray-900 p-3 rounded border border-gray-700 text-sm mb-2">
                  {promptOutput}
                </div>
                <button
                  onClick={copyPrompt}
                  className="px-3 py-1 bg-purple-600 hover:bg-purple-700 rounded text-sm transition flex items-center gap-2"
                >
                  <Copy size={14} />
                  Copy
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'rosetta' && (
          <div>
            <h2 className="text-2xl font-bold mb-4">Rosetta Table</h2>
            <div className="overflow-x-auto">
              <table className="w-full bg-gray-800 rounded-lg overflow-hidden">
                <thead className="bg-gray-700">
                  <tr>
                    <th className="p-3 text-left">Concept</th>
                    <th className="p-3 text-left">UIN</th>
                    <th className="p-3 text-left">SVG</th>
                    <th className="p-3 text-left">Prompt</th>
                    <th className="p-3 text-left">Forensic</th>
                    <th className="p-3 text-left">CAD</th>
                    <th className="p-3 text-left">Strength</th>
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
          </div>
        )}

        {activeTab === 'export' && (
          <div className="space-y-6">
            {/* Depth Map */}
            <div className="bg-gray-800 rounded-lg p-4">
              <h2 className="text-xl font-semibold mb-4">Depth Map (ControlNet)</h2>
              {depthMapDataURL && (
                <div className="mb-4">
                  <img src={depthMapDataURL} alt="Depth Map" className="max-w-md border border-gray-700 rounded" />
                </div>
              )}
              <button
                onClick={downloadDepthMap}
                disabled={!depthMapDataURL}
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-600 rounded flex items-center gap-2 transition"
              >
                <Download size={18} />
                Download Depth Map
              </button>
            </div>

            {/* CLI Info */}
            <div className="bg-gray-800 rounded-lg p-4">
              <h2 className="text-xl font-semibold mb-4">CLI Usage</h2>
              <pre className="bg-gray-900 p-3 rounded text-xs overflow-auto text-green-400">
{`# Render to SVG
uin render scene.json -o output.svg

# Generate depth map
uin depth scene.json -o depth.png

# Generate prompt
uin prompt scene.json

# Generate ComfyUI workflow
uin comfyui scene.json -o workflow.json`}
              </pre>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="bg-gray-800 border-t border-gray-700 p-3 text-center text-sm text-gray-400">
        UIN Engine v0.3 | Powered by @uin/core + @uin/adapters
      </div>
    </div>
  );
};

export default UINHybridTool;
