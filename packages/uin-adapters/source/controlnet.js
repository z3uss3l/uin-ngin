import { UINParser, validateUIN, generateDepthPNG } from '@uin/core';

/**
 * ControlNet Adapter - generates depth map for ControlNet
 * @param {string|object} input - UIN JSON
 * @param {object} options - Generation options
 * @returns {Promise<string|Buffer>} PNG as base64 (browser) or Buffer (node)
 */
export async function toDepthMap(input, options = {}) {
  const parser = new UINParser(input);
  
  // Validate if requested
  if (options.validate !== false) {
    validateUIN(parser.raw);
  }
  
  return await generateDepthPNG(parser);
}

/**
 * Save depth map to file (Node.js only)
 */
export async function saveDepthMap(input, outputPath, options = {}) {
  const depthData = await toDepthMap(input, options);
  
  // Node.js environment
  if (Buffer.isBuffer(depthData)) {
    const fs = await import('fs/promises');
    await fs.writeFile(outputPath, depthData);
    return outputPath;
  }
  
  // Browser environment - download via blob
  if (typeof window !== 'undefined') {
    const base64Data = depthData.split(',')[1];
    const blob = new Blob(
      [Uint8Array.from(atob(base64Data), c => c.charCodeAt(0))],
      { type: 'image/png' }
    );
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = outputPath;
    a.click();
    URL.revokeObjectURL(url);
    
    return outputPath;
  }
  
  throw new Error('Cannot save file in this environment');
}

/**
 * Generate ComfyUI workflow with depth map
 */
export async function toComfyUIWorkflow(input, options = {}) {
  const parser = new UINParser(input);
  const depthData = await generateDepthPNG(parser);
  
  // Load workflow template
  const workflowTemplate = options.workflowTemplate || getDefaultWorkflow();
  
  // Inject depth map reference
  workflowTemplate["11"].inputs.image = "uin_depth_map.png";
  
  // Inject prompt if adapter available
  if (options.includePrompt) {
    const { toPrompt } = await import('./prompt.js');
    const prompt = toPrompt(input);
    workflowTemplate["6"].inputs.text = prompt;
  }
  
  return {
    workflow: workflowTemplate,
    depthMap: depthData
  };
}

function getDefaultWorkflow() {
  return {
    "3": { "class_type": "KSampler", "inputs": { "seed": 0, "steps": 30, "cfg": 7, "sampler_name": "dpmpp_2m", "scheduler": "karras", "denoise": 1, "model": ["4", 0], "positive": ["12", 0], "negative": ["7", 0], "latent_image": ["5", 0] } },
    "4": { "class_type": "CheckpointLoaderSimple", "inputs": { "ckpt_name": "flux1-dev.safetensors" } },
    "5": { "class_type": "EmptyLatentImage", "inputs": { "width": 1024, "height": 1024, "batch_size": 1 } },
    "6": { "class_type": "CLIPTextEncode", "inputs": { "text": "PROMPT_PLACEHOLDER", "clip": ["4", 1] } },
    "7": { "class_type": "CLIPTextEncode", "inputs": { "text": "blurry, deformed, low quality", "clip": ["4", 1] } },
    "10": { "class_type": "ControlNetLoader", "inputs": { "control_net_name": "control_v11f1p_sd15_depth.pth" } },
    "11": { "class_type": "LoadImage", "inputs": { "image": "uin_depth_map.png" } },
    "12": { "class_type": "ControlNetApply", "inputs": { "strength": 1.0, "conditioning": ["6", 0], "control_net": ["10", 0], "image": ["11", 0] } },
    "13": { "class_type": "VAEDecode", "inputs": { "samples": ["3", 0], "vae": ["4", 2] } },
    "14": { "class_type": "SaveImage", "inputs": { "filename_prefix": "UIN_generated", "images": ["13", 0] } }
  };
}
