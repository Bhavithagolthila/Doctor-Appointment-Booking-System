// FIX: doctor images uploaded via the admin panel are served by the backend
// at /uploads/doctors/xxx.png. DoctorCard.jsx already resolved that correctly,
// but DoctorDetail/MyAppointments/Payment treated it as a frontend-relative
// path and it would 404. This derives the backend's origin from the same
// VITE_API_URL env var the API client uses, instead of hardcoding localhost.
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const BACKEND_ORIGIN = API_URL.replace(/\/api\/?$/, '');

export function resolveImageUrl(image, fallback = '/doc1.png') {
  if (!image) return fallback;
  if (image.startsWith('http')) return image;
  if (image.startsWith('/uploads/')) return `${BACKEND_ORIGIN}${image}`;
  return image; // e.g. /doc1.png — served from the frontend's own public folder
}
