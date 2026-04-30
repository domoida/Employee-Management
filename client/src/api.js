import axios from 'axios';

const API = axios.create({ baseURL: 'http://localhost:5001/api' });

// Attach JWT token to every request
API.interceptors.request.use((req) => {
  const token = localStorage.getItem('token');
  if (token) req.headers['x-auth-token'] = token;
  return req;
});

// Unwrap structured responses so components get data directly
API.interceptors.response.use(
  (res) => {
    if (res.data && typeof res.data.status === 'boolean') {
      res.data = res.data.data;
    }
    return res;
  },
  (err) => {
    const payload = err.response?.data;
    err.userMessage = payload?.error
      ? (Array.isArray(payload.error) ? payload.error.join(', ') : payload.error)
      : payload?.message || 'Something went wrong';
    return Promise.reject(err);
  }
);

export default API;