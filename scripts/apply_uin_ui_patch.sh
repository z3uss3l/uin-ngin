#!/usr/bin/env bash
set -euo pipefail

echo "Backing up existing files..."
for f in "packages/uin-ui/App.jsx" "packages/uin-ui/src/App.test.jsx" "packages/uin-ui/package.json"; do
  if [ -f "$f" ]; then
    cp "$f" "$f.bak"
    echo "Backed up $f -> $f.bak"
  fi
done

echo "Writing updated App.jsx..."
cat > packages/uin-ui/App.jsx <<'APP'
import React, { useState, useEffect } from 'react';
import { Download, RefreshCw, Eye, Code, Grid, Layers, Copy } from 'lucide-react';
import { validateUIN } from '@uin/core';
import { toSVG, toDepthMap, toPrompt } from '@uin/adapters';

const samples = {
  demo: `{
  "version": "0.3",
  "metadata": {"description": "Demo scene"},
  "canvas": {"aspect_ratio": "16:9"},
  "objects": [{"id":"person1","type":"human","position":{"x":0,"y":0,"z":0}}]
}`,
  tree: `{
  "version": "0.3",
  "metadata": {"description": "Tree scene"},
  "canvas": {"aspect_ratio": "16:9"},
  "objects": [{"id":"tree1","type":"tree","position":{"x":3,"y":0,"z":4}}]
}`
};

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

  useEffect(() => {
    try {
      const parsed = JSON.parse(uinJSON);
      validateUIN(parsed);
      setParseError('');
      setSvgOutput(toSVG(parsed, { validate: false }));
      setPromptOutput(toPrompt(parsed, { validate: false }));
      toDepthMap(parsed, { validate: false }).then(dataURL => setDepthMapDataURL(dataURL));
    } catch (e) {
      setParseError(e.message);
      setSvgOutput('');
      setPromptOutput('');
      setDepthMapDataURL('');
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
    setNotif({ type: 'info', message: 'Prompt copied to clipboard' });
    setTimeout(() => setNotif(null), 2500);
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
          <div className="grid grid-cols-2 gap-6 h-full">
            {/* Left: JSON Editor */}
            <div className="flex flex-col gap-4">
              <div className="bg-gray-800 rounded-lg p-4 flex-1 flex flex-col">
                <div className="flex justify-between items-center mb-3">
                  <h2 className="text-lg font-semibold">UIN Definition</h2>
                  <button onClick={() => setUinJSON(uinJSON)} className="p-2 bg-blue-600 hover:bg-blue-700 rounded transition"><RefreshCw size={16} /></button>
                </div>
                <textarea value={uinJSON} onChange={(e) => setUinJSON(e.target.value)} className="flex-1 bg-gray-900 text-green-400 font-mono text-sm p-3 rounded border border-gray-700 resize-none" spellCheck={false} />
                {parseError && <div className="mt-2 p-2 bg-red-900/30 border border-red-700 rounded text-red-300 text-sm">{parseError}</div>}
              </div>
            </div>

            {/* Right: Outputs */}
            <div className="flex flex-col gap-4">
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

        {activeTab === 'rosetta' && (
          <div>
            <h2 className="text-2xl font-bold mb-4">Rosetta Table</h2>
            <div className="overflow-x-auto">
              <table className="w-full bg-gray-800 rounded-lg overflow-hidden"><thead className="bg-gray-700"><tr><th className="p-3 text-left">Concept</th><th className="p-3 text-left">UIN</th><th className="p-3 text-left">SVG</th><th className="p-3 text-left">Prompt</th><th className="p-3 text-left">Forensic</th><th className="p-3 text-left">CAD</th><th className="p-3 text-left">Strength</th></tr></thead><tbody>{}</tbody></table>
            </div>
          </div>
        )}

        {activeTab === 'export' && (
          <div className="space-y-6">
            <div className="bg-gray-800 rounded-lg p-4">
              <h2 className="text-xl font-semibold mb-4">Depth Map (ControlNet)</h2>
              {depthMapDataURL && <div className="mb-4"><img src={depthMapDataURL} alt="Depth Map" className="max-w-md border border-gray-700 rounded" /></div>}
              <div className="flex items-center gap-3">
                <button onClick={downloadDepthMap} disabled={!depthMapDataURL} className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-600 rounded flex items-center gap-2 transition"><Download size={18} />Download Depth Map</button>
                <button onClick={sendToComfyUI} disabled={!depthMapDataURL || isGenerating} className="px-6 py-3 bg-teal-600 hover:bg-teal-700 disabled:bg-gray-600 rounded flex items-center gap-2 transition">{isGenerating? 'Sending...' : 'Send to ComfyUI'}</button>
              </div>
            </div>

            <div className="bg-gray-800 rounded-lg p-4">
              <h2 className="text-xl font-semibold mb-4">CLI Usage</h2>
              <pre className="bg-gray-900 p-3 rounded text-xs overflow-auto text-green-400">{`# Render to SVG
uin render scene.json -o output.svg

# Generate depth map
uin depth scene.json -o depth.png

# Generate prompt
uin prompt scene.json

# Generate ComfyUI workflow
uin comfyui scene.json -o workflow.json`}</pre>
            </div>
          </div>
        )}
      </div>

      <div className="bg-gray-800 border-t border-gray-700 p-3 text-center text-sm text-gray-400">UIN Engine v0.3 | Powered by @uin/core + @uin/adapters</div>
    </div>
  );
};

export default UINHybridTool;
APP

echo "Writing test file..."
cat > packages/uin-ui/src/App.test.jsx <<'TEST'
import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';

jest.mock('@uin/adapters', () => ({
  toSVG: jest.fn(() => '<svg></svg>'),
  toDepthMap: jest.fn(() => Promise.resolve('data:image/png;base64,AAA')),
  toPrompt: jest.fn(() => 'test prompt')
}));

import UINHybridTool from '../App';

describe('UINHybridTool', () => {
  beforeEach(() => {
    global.fetch = jest.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve({ status: 'enqueued' }) }));
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  test('send button disabled until depth map available and sends to API', async () => {
    render(<UINHybridTool />);

    const sendButton = screen.getByRole('button', { name: /send to comfyui/i });
    expect(sendButton).toBeDisabled();

    // Wait for async depth map generation
    await waitFor(() => expect(global.fetch).not.toHaveBeenCalled());

    // After depth map resolves, button should be enabled
    await waitFor(() => expect(sendButton).toBeEnabled());

    fireEvent.click(sendButton);

    await waitFor(() => expect(global.fetch).toHaveBeenCalledWith('/api/generate', expect.objectContaining({ body: expect.stringContaining('depthMapBase64') })));

    // Notification should appear
    expect(screen.getByText(/enqueued/i)).toBeInTheDocument();
  });
});
TEST

# Update package.json using node
node -e "const fs=require('fs');const p='packages/uin-ui/package.json';let j=JSON.parse(fs.readFileSync(p));j.scripts=j.scripts||{};j.scripts.test='react-scripts test --env=jsdom --watchAll=false --runInBand';j.devDependencies=j.devDependencies||{};j.devDependencies['@testing-library/react']='^14.0.0';j.devDependencies['@testing-library/jest-dom']='^6.0.0';fs.writeFileSync(p, JSON.stringify(j,null,2)+'\n');console.log('Updated package.json');"

# Run npm steps
pushd packages/uin-ui
npm ci
npm test -- --watchAll=false --runInBand
npm run build
popd

# Git commit & push
git switch -c feature/ui-polish-tests
git add packages/uin-ui/App.jsx packages/uin-ui/src/App.test.jsx packages/uin-ui/package.json
git commit -m "ui: add send-to-ComfyUI action, notifications, sample selection; add unit test"
git push -u origin feature/ui-polish-tests

echo "Done."
