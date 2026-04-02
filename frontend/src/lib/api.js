const BASE = '/api';

function getToken() {
  try {
    const session = JSON.parse(localStorage.getItem('session') || 'null');
    return session?.access_token || null;
  } catch {
    return null;
  }
}

async function request(path, options = {}) {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({ success: false, message: res.statusText }));

  if (!res.ok) {
    const err = new Error(data.message || 'Request failed');
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

export const api = {
  get: (path, params) => {
    const url = params
      ? `${path}?${new URLSearchParams(params).toString()}`
      : path;
    return request(url);
  },
  post: (path, body) => request(path, { method: 'POST', body: JSON.stringify(body) }),
  put: (path, body) => request(path, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (path) => request(path, { method: 'DELETE' }),
};

// ── Domain helpers ──────────────────────────────────────────

export const authApi = {
  register: (body) => api.post('/auth/register', body),
  login: (body) => api.post('/auth/login', body),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
  updateMe: (body) => api.put('/auth/me', body),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (password) => api.put('/auth/reset-password', { password }),
};

export const productsApi = {
  list: (params) => api.get('/products', params),
  get: (slug) => api.get(`/products/${slug}`),
  mine: (params) => api.get('/products/vendor/mine', params),
  create: (body) => api.post('/products', body),
  update: (id, body) => api.put(`/products/${id}`, body),
  remove: (id) => api.delete(`/products/${id}`),
};

export const categoriesApi = {
  list: () => api.get('/categories'),
};

export const ordersApi = {
  create: (body) => api.post('/orders', body),
  list: (params) => api.get('/orders', params),
  get: (id) => api.get(`/orders/${id}`),
  cancel: (id) => api.post(`/orders/${id}/cancel`),
  updateStatus: (id, body) => api.put(`/orders/${id}/status`, body),
  updateVendorStatus: (id, body) => api.put(`/orders/${id}/vendor-status`, body),
};

export const reviewsApi = {
  list: (params) => api.get('/reviews', params),
  create: (body) => api.post('/reviews', body),
  update: (id, body) => api.put(`/reviews/${id}`, body),
  remove: (id) => api.delete(`/reviews/${id}`),
  markHelpful: (id) => api.post(`/reviews/${id}/helpful`),
};

export const vendorsApi = {
  dashboard: () => api.get('/vendors/dashboard'),
  orders: (params) => api.get('/vendors/orders', params),
  profile: () => api.get('/vendors/profile'),
  updateProfile: (body) => api.put('/vendors/profile', body),
  storefront: (id) => api.get(`/vendors/${id}`),
};

export const adminApi = {
  dashboard: () => api.get('/admin/dashboard'),
  users: (params) => api.get('/admin/users', params),
  updateUser: (id, body) => api.put(`/admin/users/${id}`, body),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  vendors: (params) => api.get('/admin/vendors', params),
  approveVendor: (id, is_approved) => api.put(`/admin/vendors/${id}/approve`, { is_approved }),
  products: (params) => api.get('/admin/products', params),
  featureProduct: (id, is_featured) => api.put(`/admin/products/${id}/feature`, { is_featured }),
  orders: (params) => api.get('/admin/orders', params),
  reviews: (params) => api.get('/admin/reviews', params),
};
