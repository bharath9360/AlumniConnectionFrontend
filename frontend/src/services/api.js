import axios from 'axios';

// ─── Axios Instance ───────────────────────────────────────────
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  headers: { 'Content-Type': 'application/json' }
});

// ─── Request Interceptor: Attach JWT ─────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('alumni_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response Interceptor: Handle 401 ────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('alumni_token');
      localStorage.removeItem('alumni_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ─── Auth Service ─────────────────────────────────────────────
export const authService = {
  login: (email, password, role) =>
    api.post('/auth/login', { email, password, role }),

  register: (formData) =>
    api.post('/auth/register', formData),

  verifyOtp: (email, otp) =>
    api.post('/auth/verify-otp', { email, otp }),

  resendOtp: (email) =>
    api.post('/auth/resend-otp', { email }),

  getMe: () => api.get('/auth/me'),

  getUserById: (userId) => api.get(`/auth/users/${userId}`)
};

// ─── Post / Feed Service ──────────────────────────────────────
export const postService = {
  getFeed: () => api.get('/posts'),
  createPost: (data) => api.post('/posts', data),
  likePost: (postId) => api.put(`/posts/${postId}/like`),
  addComment: (postId, content) => api.post(`/posts/${postId}/comment`, { content }),
  deletePost: (postId) => api.delete(`/posts/${postId}`)
};

// ─── Job Service ──────────────────────────────────────────────
export const jobService = {
  getJobs: () => api.get('/jobs'),
  getPendingJobs: () => api.get('/jobs/pending'),
  createJob: (data) => api.post('/jobs', data),
  applyJob: (jobId) => api.put(`/jobs/${jobId}/apply`),
  approveJob: (jobId) => api.put(`/jobs/${jobId}/approve`),
  rejectJob: (jobId) => api.put(`/jobs/${jobId}/reject`),
  deleteJob: (jobId) => api.delete(`/jobs/${jobId}`)
};

// ─── Event Service ────────────────────────────────────────────
export const eventService = {
  getEvents: () => api.get('/events'),
  getPendingEvents: () => api.get('/events/pending'),
  createEvent: (data) => api.post('/events', data),
  toggleRegister: (eventId) => api.put(`/events/${eventId}/register`),
  approveEvent: (eventId) => api.put(`/events/${eventId}/approve`),
  rejectEvent: (eventId) => api.put(`/events/${eventId}/reject`),
  deleteEvent: (eventId) => api.delete(`/events/${eventId}`)
};

// ─── Notification Service ─────────────────────────────────────
export const notificationService = {
  getNotifications: () => api.get('/notifications'),
  markRead: (id) => api.put(`/notifications/${id}/read`),
  markAllRead: () => api.put('/notifications/read-all'),
  delete: (id) => api.delete(`/notifications/${id}`)
};

// ─── Chat / Messaging Service ─────────────────────────────────
export const chatService = {
  fetchChats: () => api.get('/chat'),
  fetchMessages: (chatId) => api.get(`/chat/${chatId}/messages`),
  accessChat: (userId) => api.post('/chat', { userId }),
  searchUsers: (searchQuery) => api.get(`/chat/users/search?q=${searchQuery}`),
  sendMessage: (chatId, text) => api.post(`/chat/${chatId}/messages`, { text })
};

// ─── Connections Service ──────────────────────────────────────
export const connectionService = {
  sendRequest: (userId) => api.post(`/connections/request/${userId}`),
  acceptRequest: (userId) => api.put(`/connections/accept/${userId}`),
  removeConnection: (userId) => api.delete(`/connections/remove/${userId}`),
  getStatus: (userId) => api.get(`/connections/status/${userId}`)
};

// ─── Admin Service ────────────────────────────────────────────
export const adminService = {
  getPendingAlumni: () => api.get('/admin/pending-alumni'),
  activateUser: (userId) => api.put(`/admin/activate/${userId}`),
  rejectUser: (userId) => api.delete(`/admin/reject/${userId}`),
  getStats: () => api.get('/admin/stats')
};

export default api;

