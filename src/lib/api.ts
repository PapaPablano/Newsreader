// When the frontend and API share an origin (local dev, or the API server
// itself serving the built frontend), relative paths work and this is ''.
// The GitHub Pages build sets VITE_API_BASE_URL to the deployed API's origin
// since Pages can only serve static files.
export const API_BASE = import.meta.env.VITE_API_BASE_URL || '';
