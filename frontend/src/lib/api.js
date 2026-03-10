import axios from 'axios';

const API_URL = `${process.env.REACT_APP_BACKEND_URL}/api`;

const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('solisboard_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('solisboard_token');
      localStorage.removeItem('solisboard_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export const auth = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
};

export const brands = {
  list: () => api.get('/brands'),
  update: (id, data) => api.put(`/brands/${id}`, data),
};

export const socialAccounts = {
  list: (brandId) => api.get(`/brands/${brandId}/social-accounts`),
  add: (brandId, data) => api.post(`/brands/${brandId}/social-accounts`, data),
  remove: (brandId, id) => api.delete(`/brands/${brandId}/social-accounts/${id}`),
};

export const campaigns = {
  list: (brandId) => api.get('/campaigns', { params: { brand_id: brandId } }),
  create: (data) => api.post('/campaigns', data),
  get: (id) => api.get(`/campaigns/${id}`),
  update: (id, data) => api.put(`/campaigns/${id}`, data),
  delete: (id) => api.delete(`/campaigns/${id}`),
  ideate: (id, data) => api.post(`/campaigns/${id}/ideate`, data),
};

export const posts = {
  list: (params) => api.get('/posts', { params }),
  create: (data) => api.post('/posts', data),
  get: (id) => api.get(`/posts/${id}`),
  update: (id, data) => api.put(`/posts/${id}`, data),
  delete: (id) => api.delete(`/posts/${id}`),
};

export const generate = {
  text: (data) => api.post('/generate/text', data),
  textForPost: (postId, data) => api.post(`/generate/text/${postId}`, data),
  variations: (data) => api.post('/generate/variations', data),
  image: (data) => api.post('/generate/image', data),
  imageForPost: (postId, data) => api.post(`/generate/image/${postId}`, data),
  video: (data) => api.post('/generate/video', data),
  videoStatus: (reqId) => api.get(`/generate/video/status/${reqId}`),
  videoResult: (reqId) => api.get(`/generate/video/result/${reqId}`),
};

export const schedules = {
  list: (brandId) => api.get('/schedules', { params: { brand_id: brandId } }),
  create: (data) => api.post('/schedules', data),
  delete: (id) => api.delete(`/schedules/${id}`),
  optimalTimes: (brandId) => api.get('/schedules/optimal-times', { params: { brand_id: brandId } }),
};

export const analytics = {
  overview: (brandId) => api.get('/analytics/overview', { params: { brand_id: brandId } }),
  platformMetrics: (days) => api.get('/analytics/platform-metrics', { params: { days } }),
  postPerformance: (brandId) => api.get('/analytics/post-performance', { params: { brand_id: brandId } }),
  aiAnalyze: (data) => api.post('/analytics/ai-analyze', data),
};

export const audience = {
  insights: (brandId) => api.get('/audience/insights', { params: { brand_id: brandId } }),
  activeHours: () => api.get('/audience/active-hours'),
};

export const trends = {
  list: (brandId) => api.get('/trends', { params: { brand_id: brandId } }),
  refresh: (brandId) => api.post('/trends/refresh', null, { params: { brand_id: brandId } }),
};

export const competitors = {
  list: (brandId) => api.get('/competitors', { params: { brand_id: brandId } }),
  add: (data, brandId) => api.post('/competitors', data, { params: { brand_id: brandId } }),
  delete: (id) => api.delete(`/competitors/${id}`),
};

export const sentiment = {
  list: (brandId) => api.get('/sentiment', { params: { brand_id: brandId } }),
  analyze: (data) => api.post('/sentiment/analyze', data),
};

export const alerts = {
  list: (brandId, resolved) => api.get('/alerts', { params: { brand_id: brandId, resolved } }),
  resolve: (id) => api.put(`/alerts/${id}/resolve`),
  boostSuggestions: () => api.get('/alerts/boost-suggestions'),
};

export const reports = {
  list: (brandId) => api.get('/reports/weekly', { params: { brand_id: brandId } }),
  generate: (data) => api.post('/reports/generate', data),
};

export const team = {
  list: (brandId) => api.get('/team', { params: { brand_id: brandId } }),
  add: (data) => api.post('/team', data),
  remove: (id) => api.delete(`/team/${id}`),
  updateRole: (id, role) => api.put(`/team/${id}`, { role }),
};

export default api;
