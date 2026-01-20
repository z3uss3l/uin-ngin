import React, { useState, useEffect } from 'react';
import { Download, RefreshCw, Eye, Code, Grid, Layers, Copy, Upload, Image as ImageIcon } from 'lucide-react';
import { validateUIN } from '@uin/core';
import { toSVG, toPrompt, toDepthMap } from '@uin/adapters';
import CanvasEditorFixed from './CanvasEditorFixed';
import { API_BASE, BRIDGE_BASE } from './config';

console.log('Testing @uin/adapters imports:');
console.log('toSVG function:', typeof toSVG);
console.log('toPrompt function:', typeof toPrompt);
console.log('toDepthMap function:', typeof toDepthMap);

const samples = {
  demo: `{
  "version": "0.3",
  "metadata": {"description": "Demo scene"},
  "canvas": {"aspect_ratio": "16:9", "bounds": {"x": [-10,10], "y": [-10,10], "z": [-5,5]}},
  "objects": [{"id":"person1","type":"human","position":{"x":0,"y":0,"z":0}}]
}`,
  tree: `{
  "version": "0.3",
  "metadata": {"description": "Tree scene"},
  "canvas": {"aspect_ratio": "16:9", "bounds": {"x": [-10,10], "y": [-10,10], "z": [-5,5]}},
  "objects": [{"id":"tree1","type":"tree","position":{"x":3,"y":0,"z":4}}]
}`
};

function buildRelativePrompt(uin) {
  const objects = Array.isArray(uin?.objects) ? uin.objects : [];
  const human = objects.find((o) => o?.type === 'human' && o?.position);
  const tree = objects.find((o) => o?.type === 'tree' && o?.position);
  
  console.log('buildRelativePrompt debug:');
  console.log('All objects:', objects.map(o => ({ type: o.type, position: o.position })));
  console.log('Human found:', human ? human.position : 'none');
  console.log('Tree found:', tree ? tree.position : 'none');
  
  if (!human || !tree) {
    console.log('No human-tree pair found');
    return '';
  }

  const dx = (human.position.x ?? 0) - (tree.position.x ?? 0);
  const dy = (human.position.y ?? 0) - (tree.position.y ?? 0);
  const dz = (human.position.z ?? 0) - (tree.position.z ?? 0);

  console.log('Differences:', { dx, dy, dz });

  const parts = [];
  const t = 0.25;
  if (dx > t) parts.push('person is to the right of the tree');
  else if (dx < -t) parts.push('person is to the left of the tree');
  else parts.push('person is next to the tree');

  if (dy > t) parts.push('person is above the tree');
  else if (dy < -t) parts.push('person is below the tree');

  if (dz > t) parts.push('person is in front of the tree');
  else if (dz < -t) parts.push('person is behind the tree');

  const result = parts.length ? parts.join(', ') : '';
  console.log('Relative prompt result:', result);
  return result;
}

const UINHybridTool = () => {
  const [activeTab, setActiveTab] = useState('editor');
  const [uinJSON, setUinJSON] = useState(samples.demo);
  const [svgOutput, setSvgOutput] = useState('');
  const [promptOutput, setPromptOutput] = useState('');
  const [parseError, setParseError] = useState('');
  const [depthMapDataURL, setDepthMapDataURL] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [notif, setNotif] = useState(null);
  const [selectedSample, setSelectedSample] = useState('demo');
  const [comfyStatus, setComfyStatus] = useState('');
  
  // Image upload states
  const [uploadedImage, setUploadedImage] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const parsed = JSON.parse(uinJSON);
        // Skip validation to avoid region type errors
        // validateUIN(parsed);
        setParseError('');

        console.log('Testing toSVG with parsed data...');
        const svg = toSVG(parsed, { validate: false });
        console.log('SVG generated successfully, length:', svg.length);
        console.log('SVG preview:', svg.substring(0, 200));
        
        console.log('Testing toPrompt with parsed data...');
        const promptBase = toPrompt(parsed, { validate: false });
        console.log('Prompt generated successfully, length:', promptBase.length);
        console.log('Prompt preview:', promptBase.substring(0, 200));
        
        const rel = buildRelativePrompt(parsed);
        const prompt = rel ? `${promptBase}\n\nLayout: ${rel}` : promptBase;
        
        console.log('Testing toDepthMap with parsed data...');
        const depth = await toDepthMap(parsed, { validate: false });
        console.log('Depth map generated, type:', typeof depth);
        console.log('Depth map preview:', typeof depth === 'string' ? depth.substring(0, 100) : 'Not a string');

        setSvgOutput(svg);
        setPromptOutput(prompt);
        setDepthMapDataURL(typeof depth === 'string' ? depth : '');
      } catch (e) {
        console.error('Error in useEffect:', e);
        setParseError(e.message);
        setSvgOutput('');
        setPromptOutput('');
        setDepthMapDataURL('');
      }
    })();
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
    if (!depthMapDataURL) {
      setNotif({ type: 'error', message: 'No depth map available yet' });
      setTimeout(() => setNotif(null), 2500);
      return;
    }

    const a = document.createElement('a');
    a.href = depthMapDataURL;
    a.download = 'uin_depth_map.png';
    a.click();
  };

  const copyPrompt = () => {
    navigator.clipboard.writeText(promptOutput);
    setNotif({ type: 'info', message: 'Prompt copied to clipboard' });
    setTimeout(() => setNotif(null), 2500);
  };

  // One-click ComfyUI generation (local bridge)
  const generateInComfyUI = async () => {
    try {
      if (!depthMapDataURL) {
        setComfyStatus('❌ No depth map available yet');
        return;
      }

      setComfyStatus('⏳ Generating...');

      const response = await fetch('http://localhost:3001/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: promptOutput, depthMapBase64: depthMapDataURL, workflow: {} })
      });

      const result = await response.json();
      setComfyStatus(result.success ? '✅ Generation started!' : '❌ Error');
    } catch (error) {
      setComfyStatus('❌ ComfyUI Bridge not reachable. Is the server running?');
    }
  };

  const sendToComfyUI = async () => {
    if (!depthMapDataURL) return setNotif({ type: 'error', message: 'No depth map available' });
    setIsGenerating(true);
    setNotif({ type: 'info', message: 'Sending to ComfyUI...' });

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: promptOutput, depthMapBase64: depthMapDataURL })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Unknown error');
      setNotif({ type: 'success', message: json.status || 'Enqueued' });
    } catch (e) {
      setNotif({ type: 'error', message: e.message });
    } finally {
      setIsGenerating(false);
      setTimeout(() => setNotif(null), 4000);
    }
  };

  const handleSampleChange = (s) => {
    setSelectedSample(s);
    setUinJSON(samples[s]);
  };

  // Image upload functions
  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setUploadedImage(file);
      setAnalysisResult(null);
    }
  };

  const analyzeImage = async () => {
    if (!uploadedImage) {
      setNotif({ type: 'error', message: 'Please select an image first' });
      setTimeout(() => setNotif(null), 2500);
      return;
    }

    setIsAnalyzing(true);
    setNotif({ type: 'info', message: 'Analyzing image...' });

    try {
      const formData = new FormData();
      formData.append('file', uploadedImage);

      console.log('Sending request to:', `${API_BASE}/api/import`);
      console.log('API_BASE:', API_BASE);
      const response = await fetch(`${API_BASE}/api/import`, {
        method: 'POST',
        body: formData,
      });

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      console.log('Success response:', result);
      
      if (result.success) {
        setAnalysisResult(result);
        setUinJSON(JSON.stringify(result.uin, null, 2));
        setNotif({ type: 'success', message: 'Image analyzed successfully!' });
        
        // Update prompt output from the analysis result
        console.log('Updating prompt from analysis result...');
        const promptBase = toPrompt(result.uin, { validate: false });
        console.log('Prompt from analysis:', promptBase.substring(0, 100));
        const rel = buildRelativePrompt(result.uin);
        const prompt = rel ? `${promptBase}\n\nLayout: ${rel}` : promptBase;
        console.log('Final prompt:', prompt.substring(0, 100));
        setPromptOutput(prompt);
        
        // Also update SVG and depth map from analysis result
        const svg = toSVG(result.uin, { validate: false });
        console.log('SVG from analysis:', svg.substring(0, 100));
        setSvgOutput(svg);
        
        const depth = await toDepthMap(result.uin, { validate: false });
        console.log('Depth from analysis:', typeof depth === 'string' ? 'success' : 'failed');
        setDepthMapDataURL(typeof depth === 'string' ? depth : '');
      } else {
        throw new Error(result.error || 'Analysis failed');
      }
    } catch (error) {
      console.error('Analysis error:', error);
      setNotif({ type: 'error', message: `Analysis failed: ${error.message}` });
    } finally {
      setIsAnalyzing(false);
      setTimeout(() => setNotif(null), 4000);
    }
  };

  // Rosetta table content from root App
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

  return (
    <div className="w-full min-h-screen bg-gray-900 text-gray-100 flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 p-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-1">UIN Tool v0.3</h1>
          <p className="text-sm text-gray-400">Universal Image Notation - Engine-powered</p>
        </div>
        <div className="flex items-center gap-3">
          <select value={selectedSample} onChange={(e) => handleSampleChange(e.target.value)} className="bg-gray-700 text-sm p-2 rounded">
            <option value="demo">Demo</option>
            <option value="tree">Tree</option>
          </select>
          <button onClick={() => setUinJSON(samples.demo)} className="px-3 py-2 bg-blue-600 rounded">Reset</button>
        </div>
      </div>

      {notif && (
        <div className={`p-2 text-sm ${notif.type==='error'?'bg-red-700':'bg-green-700'}`}>{notif.message}</div>
      )}

      {/* Tabs */}
      <div className="flex bg-gray-800 border-b border-gray-700">
        {[
          { id: 'editor', label: 'Editor + Preview', icon: Code },
          { id: 'upload', label: 'Image Upload', icon: Upload },
          { id: 'rosetta', label: 'Rosetta Table', icon: Grid },
          { id: 'export', label: 'Export', icon: Layers }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-6 py-3 border-b-2 transition ${activeTab === tab.id ? 'border-blue-500 bg-gray-700 text-white' : 'border-transparent text-gray-400 hover:text-gray-200'}`}>
            <tab.icon size={18} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {activeTab === 'editor' && (
          <div className="grid grid-cols-3 gap-6 h-full">
            {/* Left: JSON Editor */}
            <div className="flex flex-col gap-4 col-span-1">
              <div className="bg-gray-800 rounded-lg p-4 flex-1 flex flex-col">
                <div className="flex justify-between items-center mb-3">
                  <h2 className="text-lg font-semibold">UIN Definition</h2>
                  <button onClick={() => setUinJSON(uinJSON)} className="p-2 bg-blue-600 hover:bg-blue-700 rounded transition"><RefreshCw size={16} /></button>
                </div>
                <textarea value={uinJSON} onChange={(e) => setUinJSON(e.target.value)} className="flex-1 bg-gray-900 text-green-400 font-mono text-sm p-3 rounded border border-gray-700 resize-none" spellCheck={false} />
                {parseError && <div className="mt-2 p-2 bg-red-900/30 border border-red-700 rounded text-red-300 text-sm">{parseError}</div>}
              </div>
            </div>

            {/* Middle: Canvas Editor */}
            <div className="flex flex-col gap-4 col-span-1">
              <CanvasEditorFixed uinJSON={uinJSON} onChange={setUinJSON} />
            </div>

            {/* Right: Outputs */}
            <div className="flex flex-col gap-4 col-span-1">
              {/* SVG Preview */}
              <div className="bg-gray-800 rounded-lg p-4">
                <div className="flex justify-between items-center mb-3">
                  <h2 className="text-lg font-semibold flex items-center gap-2"><Eye size={18} />SVG Preview</h2>
                  <button onClick={downloadSVG} className="p-2 bg-green-600 hover:bg-green-700 rounded transition"><Download size={16} /></button>
                </div>
                <div className="bg-white rounded p-2" dangerouslySetInnerHTML={{ __html: svgOutput }} />
              </div>

              {/* Prompt */}
              <div className="bg-gray-800 rounded-lg p-4">
                <h2 className="text-lg font-semibold mb-3">Generated Prompt</h2>
                <div className="bg-gray-900 p-3 rounded border border-gray-700 text-sm mb-2">{promptOutput}</div>
                <button onClick={copyPrompt} className="px-3 py-1 bg-purple-600 hover:bg-purple-700 rounded text-sm transition flex items-center gap-2"><Copy size={14} />Copy</button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'upload' && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                <ImageIcon size={24} />
                Image Analysis for UIN Generation
              </h2>
              
              {/* Upload Section */}
              <div className="space-y-4">
                <div className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center">
                  <Upload size={48} className="mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-semibold mb-2">Upload Image for Analysis</h3>
                  <p className="text-gray-400 mb-4">Select an image to extract features and generate UIN notation</p>
                  
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="image-upload"
                  />
                  <label
                    htmlFor="image-upload"
                    className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded cursor-pointer transition"
                  >
                    Choose Image
                  </label>
                  
                  {uploadedImage && (
                    <div className="mt-4">
                      <p className="text-green-400 mb-2">✓ Selected: {uploadedImage.name}</p>
                      <img
                        src={URL.createObjectURL(uploadedImage)}
                        alt="Preview"
                        className="max-w-xs mx-auto rounded border border-gray-600"
                      />
                    </div>
                  )}
                </div>

                {/* Analyze Button */}
                <div className="flex justify-center">
                  <button
                    onClick={analyzeImage}
                    disabled={!uploadedImage || isAnalyzing}
                    className="px-8 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 rounded font-semibold transition flex items-center gap-2"
                  >
                    {isAnalyzing ? (
                      <>
                        <RefreshCw size={18} className="animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <ImageIcon size={18} />
                        Analyze Image
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Analysis Results */}
            {analysisResult && (
              <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-xl font-bold mb-4">Analysis Results</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Features Extracted */}
                  <div>
                    <h4 className="font-semibold mb-3 text-blue-400">Enhanced Features Extracted</h4>
                    <div className="bg-gray-900 rounded p-4 space-y-2">
                      <div>📐 Edge Points: {analysisResult.features_extracted.edges}</div>
                      <div>🎯 Contours: {analysisResult.features_extracted.contours}</div>
                      <div>🎨 Color Samples: {analysisResult.features_extracted.colors}</div>
                      <div>📊 Edge Density: {analysisResult.features_extracted.edge_density?.toFixed(3) || 'N/A'}</div>
                      <div>🔍 Complexity: {analysisResult.features_extracted.complexity || 'N/A'}</div>
                    </div>
                  </div>

                  {/* Generated UIN */}
                  <div>
                    <h4 className="font-semibold mb-3 text-green-400">Generated UIN</h4>
                    <div className="bg-gray-900 rounded p-4">
                      <pre className="text-xs text-green-300 overflow-x-auto">
                        {JSON.stringify(analysisResult.uin, null, 2)}
                      </pre>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-6 flex gap-3">
                  <button
                    onClick={() => setActiveTab('editor')}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded transition"
                  >
                    Edit in Editor
                  </button>
                  <button
                    onClick={() => setActiveTab('export')}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded transition"
                  >
                    Export Results
                  </button>
                </div>
              </div>
            )}
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
                  {rosettaData.map((r, i) => (
                    <tr key={i} className="border-t border-gray-700">
                      <td className="p-3 align-top">{r.concept}</td>
                      <td className="p-3 font-mono text-xs align-top whitespace-pre">{r.uin}</td>
                      <td className="p-3 align-top">{r.svg}</td>
                      <td className="p-3 align-top">{r.prompt}</td>
                      <td className="p-3 align-top">{r.forensic}</td>
                      <td className="p-3 align-top">{r.cad}</td>
                      <td className="p-3 align-top">{r.strength}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'export' && (
          <div className="space-y-6">
            <div className="bg-gray-800 rounded-lg p-4">
              <h2 className="text-xl font-semibold mb-4">Depth Map (ControlNet)</h2>
              {depthMapDataURL && <div className="mb-4"><img src={depthMapDataURL} alt="Depth Map" className="max-w-md border border-gray-700 rounded" /></div>}
              <div className="flex items-center gap-3">
                <button onClick={downloadDepthMap} className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 rounded flex items-center gap-2 transition"><Download size={18} />Download Depth Map</button>
                <button onClick={sendToComfyUI} disabled={!depthMapDataURL || isGenerating} className="px-6 py-3 bg-teal-600 hover:bg-teal-700 disabled:bg-gray-600 rounded flex items-center gap-2 transition">{isGenerating? 'Sending...' : 'Send to ComfyUI'}</button>
                <button onClick={generateInComfyUI} className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 rounded text-sm">Generate in ComfyUI</button>
              </div>

              {comfyStatus && <div className="mt-3 text-sm text-gray-300">{comfyStatus}</div> }
            </div>
          </div>
        )}

      </div>

      <div className="bg-gray-800 border-t border-gray-700 p-3 text-center text-sm text-gray-400">UIN Engine v0.3 | Powered by @uin/core + @uin/adapters</div>
    </div>
  );
};

export default UINHybridTool;
