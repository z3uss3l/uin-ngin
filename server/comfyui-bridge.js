const express = require('express');
const cors = require('cors');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const LOG_LEVELS = { debug: 10, info: 20, warn: 30, error: 40 };
const LOG_THRESHOLD = LOG_LEVELS[String(process.env.UIN_LOG_LEVEL || 'info').toLowerCase()] ?? LOG_LEVELS.info;
function log(level, message, context = {}) {
  if (LOG_LEVELS[level] < LOG_THRESHOLD) return;
  const payload = { ts: new Date().toISOString(), level, scope: 'uin-comfyui-bridge', message, ...context };
  const fn = level === 'error' ? console.error : level === 'warn' ? console.warn : console.info;
  fn(`[UIN bridge] ${message}`, payload);
}

const app = express();
const allowedOrigins = new Set(
  (process.env.UIN_CORS_ORIGINS || 'http://localhost:3000,http://127.0.0.1:3000')
    .split(',')
    .map(value => value.trim())
    .filter(Boolean)
);

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.has('*') || allowedOrigins.has(origin)) {
      return callback(null, true);
    }
    return callback(new Error(`CORS origin not allowed: ${origin}`));
  }
}));
app.use(express.json({ limit: process.env.UIN_JSON_LIMIT || '50mb' }));

const COMFYUI_URL = process.env.COMFYUI_URL || 'http://127.0.0.1:8188';
const PORT = Number(process.env.PORT || process.env.UIN_BRIDGE_PORT || 3001);
const WORKFLOW_PATH =
  process.env.UIN_WORKFLOW_PATH ||
  path.join(__dirname, '../workflows/comfyui-uin-basic.json');

function decodeDataUrl(dataUrl) {
  if (typeof dataUrl !== 'string' || !dataUrl.startsWith('data:image/png;base64,')) {
    throw new Error('depthMapBase64 must be a PNG data URL');
  }
  const encoded = dataUrl.slice('data:image/png;base64,'.length);
  if (!encoded || !/^[A-Za-z0-9+/]+={0,2}$/.test(encoded)) {
    throw new Error('Invalid PNG base64 payload');
  }
  const buffer = Buffer.from(encoded, 'base64');
  if (!buffer.length) throw new Error('Empty depth map');
  return buffer;
}

app.post('/api/generate', async (req, res) => {
  let tempPath;
  try {
    const requestId = crypto.randomUUID();
    log('info', 'generation.request', { requestId });
    const { prompt, depthMapBase64 } = req.body || {};
    if (typeof prompt !== 'string' || !prompt.trim()) {
      return res.status(400).json({ success: false, error: 'prompt is required' });
    }

    const buffer = decodeDataUrl(depthMapBase64);
    tempPath = path.join(__dirname, `.uin-depth-${requestId}.png`);
    fs.writeFileSync(tempPath, buffer, { mode: 0o600 });

    const form = new FormData();
    form.append('image', fs.createReadStream(tempPath), {
      filename: 'uin_depth_map.png',
      contentType: 'image/png'
    });

    log('debug', 'generation.upload.start', { requestId, bytes: buffer.length });
    const uploadRes = await axios.post(`${COMFYUI_URL}/upload/image`, form, {
      headers: form.getHeaders(),
      timeout: Number(process.env.COMFYUI_TIMEOUT_MS || 30000)
    });

    const uploadedName = uploadRes.data?.name;
    if (!uploadedName) throw new Error('ComfyUI did not return an uploaded image name');

    const workflow = JSON.parse(fs.readFileSync(WORKFLOW_PATH, 'utf8'));
    if (!workflow['6']?.inputs || !workflow['11']?.inputs) {
      throw new Error('Configured workflow is missing required nodes 6/11');
    }

    workflow['6'].inputs.text = prompt;
    workflow['11'].inputs.image = uploadedName;

    const queueRes = await axios.post(`${COMFYUI_URL}/prompt`, { prompt: workflow }, {
      timeout: Number(process.env.COMFYUI_TIMEOUT_MS || 30000)
    });

    const promptId = queueRes.data?.prompt_id;
    log('info', 'generation.queued', { requestId, promptId });
    if (!promptId) throw new Error('ComfyUI did not return a prompt_id');

    res.json({
      success: true,
      promptId,
      message: 'Generation started in ComfyUI.'
    });
  } catch (error) {
    log('error', 'generation.failed', { requestId, message: error.message });
    res.status(500).json({
      success: false,
      error: error.message,
      hint: `Is ComfyUI reachable at ${COMFYUI_URL}?`
    });
  } finally {
    if (tempPath) {
      try { fs.unlinkSync(tempPath); } catch (_) {}
    }
  }
});

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'uin-comfyui-bridge',
    comfyui: COMFYUI_URL
  });
});

const uiPath = path.join(__dirname, '..', 'packages', 'uin-ui', 'build');
if (fs.existsSync(uiPath)) {
  app.use(express.static(uiPath));
  app.get('/', (_req, res) => res.sendFile(path.join(uiPath, 'index.html')));
  app.get('/gui', (_req, res) => res.sendFile(path.join(__dirname, '..', 'public', 'gui.html')));
}

app.listen(PORT, () => {
  log('info', 'server.started', { port: PORT, comfyui: COMFYUI_URL });
});
