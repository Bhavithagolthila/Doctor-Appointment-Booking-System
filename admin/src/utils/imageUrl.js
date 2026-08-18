const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const BACKEND_ORIGIN = API_URL.replace(/\/api\/?$/, '');

export function resolveImageUrl(image) {
  if (!image) return '';
  if (image.startsWith('http')) return image;
  if (image.startsWith('/uploads/')) return `${BACKEND_ORIGIN}${image}`;
  return image; // e.g. /doc1.png — served from the admin app's own public folder
}
