const BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include', // send/receive the staff session cookie
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return data;
}

export const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: 'POST', body: JSON.stringify(body) }),
  put: (path, body) => request(path, { method: 'PUT', body: JSON.stringify(body) }),
  del: (path) => request(path, { method: 'DELETE' }),
};

// Resource helpers — one line per module, matching the PHP endpoints
export const Customers = {
  list: () => api.get('/api/customers.php'),
  create: (data) => api.post('/api/customers.php', data),
};
export const Auth = {
  login: (email, password) => api.post('/api/auth.php?action=login', { email, password }),
};
export const StaffAuth = {
  me: () => api.get('/api/staff_auth.php?action=me'),
  login: (email, password) => api.post('/api/staff_auth.php?action=login', { email, password }),
  logout: () => api.post('/api/staff_auth.php?action=logout', {}),
};
export const Vehicles = {
  list: (customerId) => api.get(customerId ? `/api/vehicles.php?customer_id=${customerId}` : '/api/vehicles.php'),
  create: (data) => api.post('/api/vehicles.php', data),
};
export const Mechanics = {
  list: () => api.get('/api/mechanics.php'),
  create: (data) => api.post('/api/mechanics.php', data),
};
export const Appointments = {
  list: () => api.get('/api/appointments.php'), // staff-only — requires a staff session
  listMine: (customerId) => api.get(`/api/appointments.php?customer_id=${customerId}`),
  create: (data) => api.post('/api/appointments.php', data),
  update: (id, data) => api.put(`/api/appointments.php?id=${id}`, data),
};
export const Jobs = {
  list: (status) => api.get(status ? `/api/jobs.php?status=${encodeURIComponent(status)}` : '/api/jobs.php'),
  create: (data) => api.post('/api/jobs.php', data),
  update: (id, data) => api.put(`/api/jobs.php?id=${id}`, data),
  issuePart: (id, data) => api.post(`/api/jobs.php?action=issue-part&id=${id}`, data),
};
export const Parts = {
  list: () => api.get('/api/parts.php'),
  create: (data) => api.post('/api/parts.php', data),
  stockIn: (id, data) => api.post(`/api/parts.php?action=stock-in&id=${id}`, data),
  lowStock: () => api.get('/api/parts.php?action=low-stock'),
};
export const Orders = {
  list: () => api.get('/api/orders.php'),
  create: (data) => api.post('/api/orders.php', data),
  confirm: (id) => api.post(`/api/orders.php?action=confirm&id=${id}`, {}),
  reject: (id) => api.post(`/api/orders.php?action=reject&id=${id}`, {}),
};
export const Invoices = {
  list: () => api.get('/api/invoices.php'),
  create: (data) => api.post('/api/invoices.php', data),
};
export const Payments = {
  create: (data) => api.post('/api/payments.php', data),
};
export const Dashboard = {
  summary: () => api.get('/api/dashboard.php'),
};
