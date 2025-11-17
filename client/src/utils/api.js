import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Configuration
export const getConfig = () => api.get('/config');

// Resources
export const getResources = () => api.get('/resources');
export const getResource = (id) => api.get(`/resources/${id}`);
export const getResourceStatus = (id) => api.get(`/resources/${id}/status`);
export const getResourceSlots = (id, date, timezone = 'UTC') =>
  api.get(`/resources/${id}/slots`, { params: { date, timezone } });

// Bookings
export const createBooking = (data) => api.post('/bookings', data);
export const getBookings = (params) => api.get('/bookings', { params });
export const getBooking = (id) => api.get(`/bookings/${id}`);
export const cancelBooking = (id) => api.delete(`/bookings/${id}`);
export const updateBookingStatus = (id, status) =>
  api.put(`/bookings/${id}/status`, { status });

// Stats
export const getStats = () => api.get('/stats');

// Health
export const getHealth = () => api.get('/health');

export default api;
