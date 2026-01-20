// Simple runtime config for API endpoints used by the UI.
// Values can be provided via CRA-style env vars:
// - REACT_APP_API_BASE: backend API base (image import, etc.)
// - REACT_APP_BRIDGE_BASE: ComfyUI bridge base
// - REACT_APP_OPENCV_URL: optional OpenCV.js URL
//
// Defaults are local/offline-first.
// Backend: historically started via start_api-app8000.bat → 127.0.0.1:8000
export const API_BASE =
  process.env.REACT_APP_API_BASE || "http://127.0.0.1:8001";

export const BRIDGE_BASE =
  process.env.REACT_APP_BRIDGE_BASE || "http://localhost:3001";

// Prefer local file (if provided), fall back to CDN.
export const OPENCV_URL =
  process.env.REACT_APP_OPENCV_URL || "/opencv.js";

export const OPENCV_CDN_FALLBACK = "https://docs.opencv.org/4.x/opencv.js";
