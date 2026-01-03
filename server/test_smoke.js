const { spawn } = require('child_process');
const http = require('http');
const path = require('path');

const serverPath = path.join(__dirname, 'comfyui-bridge.js');
const proc = spawn('node', [serverPath], { stdio: 'inherit' });

// wait for server to be ready
setTimeout(() => {
  http.get('http://127.0.0.1:3001/api/health', (res) => {
    console.log('statusCode', res.statusCode);
    res.setEncoding('utf8');
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      console.log('body', data);
      proc.kill();
      if (res.statusCode === 200) process.exit(0);
      else process.exit(1);
    });
  }).on('error', (err) => {
    console.error('request failed', err.message);
    proc.kill();
    process.exit(1);
  });
}, 1500);