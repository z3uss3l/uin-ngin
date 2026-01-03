const express = require('express');
const cors = require('cors');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

const COMFYUI_URL = 'http://127.0.0.1:8188';

app.post('/api/generate', async (req, res) => {
  try {
    const { prompt, depthMapBase64 } = req.body;
    
    console.log('📥 Received generation request');
    
    // 1. Convert base64 to file
    const buffer = Buffer.from(depthMapBase64.split(',')[1], 'base64');
    const tempPath = path.join(__dirname, 'temp_depth.png');
    fs.writeFileSync(tempPath, buffer);
    console.log('💾 Saved temp depth map');
    
    // 2. Upload to ComfyUI
    const form = new FormData();
    form.append('image', fs.createReadStream(tempPath), {
      filename: 'uin_depth_map.png',
      contentType: 'image/png'
    });
    
    console.log('📤 Uploading to ComfyUI...');
    const uploadRes = await axios.post(`${COMFYUI_URL}/upload/image`, form, {
      headers: form.getHeaders()
    });
    
    const uploadedName = uploadRes.data.name;
    console.log('✅ Uploaded as:', uploadedName);
    
    // 3. Load and modify workflow
    const workflowPath = path.join(__dirname, '../workflows/comfyui-uin-basic.json');
    const workflow = JSON.parse(fs.readFileSync(workflowPath, 'utf8'));
    
    workflow["6"].inputs.text = prompt;
    workflow["11"].inputs.image = uploadedName;
    
    // 4. Queue prompt
    console.log('🎨 Queuing generation...');
    const queueRes = await axios.post(`${COMFYUI_URL}/prompt`, {
      prompt: workflow
    });
    
    // Cleanup
    fs.unlinkSync(tempPath);
    console.log('🧹 Cleaned up temp files');
    
    res.json({
      success: true,
      promptId: queueRes.data.prompt_id,
      message: 'Generation started in ComfyUI! Check the ComfyUI interface.'
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      hint: 'Is ComfyUI running on http://127.0.0.1:8188?'
    });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Bridge server is running' });
});

const PORT = 3001;
// Serve static UI (if build exists)
const uiPath = path.join(__dirname, '..', 'packages', 'uin-ui', 'build');
if (fs.existsSync(uiPath)) {
  app.use(express.static(uiPath));
  app.get('/', (req, res) => res.sendFile(path.join(uiPath, 'index.html')));
  app.get('/gui', (req, res) => res.sendFile(path.join(__dirname, '..', 'public', 'gui.html')));
}

app.listen(PORT, () => {
  console.log(`UIN ComfyUI Bridge running on http://localhost:${PORT}`);
});
