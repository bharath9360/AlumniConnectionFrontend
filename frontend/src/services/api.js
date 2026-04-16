import axios from 'axios';
import toast from 'react-hot-toast';

// ─── Axios Instance ───────────────────────────────────────────
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
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
      // Determine which login page to bounce to based on stored role
      let storedUser = null;
      try { storedUser = JSON.parse(localStorage.getItem('alumni_user') || 'null'); } catch (_) {}
      const role = storedUser?.role?.toLowerCase();

      localStorage.removeItem('alumni_token');
      localStorage.removeItem('alumni_user');

      // ── Fire a custom DOM event so AuthContext can handle the
      //    redirect via React Router (no hard page reload).
      //    AuthContext listens for 'alumni:session-expired'.
      let redirectTo = '/login';
      if (role === 'admin')   redirectTo = '/admin/login';
      else if (role === 'student') redirectTo = '/login/student';
      else if (role === 'staff')   redirectTo = '/login';

      try {
        window.dispatchEvent(
          new CustomEvent('alumni:session-expired', { detail: { redirectTo } })
        );
      } catch (_) {
        // Fallback for any edge case (e.g. during SSR/test)
        window.location.href = redirectTo;
      }
    } else if (!error.response || error.code === 'ERR_NETWORK') {
      // Part 11: Network Error Fallback
      toast.error('Check your internet connection');
    }
    return Promise.reject(error);
  }

);


// ─── Auth Service ─────────────────────────────────────────────
export const authService = {
  login: (email, password, role, secretKey) =>
    api.post('/auth/login', { email, password, role, ...(secretKey ? { secretKey } : {}) }),

  register: (formData) =>
    api.post('/auth/register', formData),

  verifyOtp: (email, otp) =>
    api.post('/auth/verify-otp', { email, otp }),

  resendOtp: (email) =>
    api.post('/auth/resend-otp', { email }),

  activateAccount: (data) =>
    api.post('/auth/activate', data),

  getMe: () => api.get('/auth/me'),

  updateProfile: (data) => api.put('/auth/profile', data),

  getUserById: (userId) => api.get(`/auth/users/${userId}`),

  // Upload profile picture as multipart/form-data
  uploadProfilePic: (formData) =>
    api.put('/auth/profile-pic', formData),

  changePassword: (oldPassword, newPassword) =>
    api.put('/auth/change-password', { oldPassword, newPassword }),
};

// ─── User Upload Service ───────────────────────────────────────
export const userService = {
  // Upload / replace profile picture (DP)
  uploadDp: (formData) =>
    api.put('/users/upload-dp', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),

  // Upload / replace banner image
  uploadBanner: (formData) =>
    api.put('/users/upload-banner', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),

  // Update profile text/array fields
  updateProfile: (data) => api.put('/users/update-profile', data),

  // Search users by name, role, company, department, batch
  searchUsers: (params) => api.get('/users/search', { params }),

  // Fetch any user's public profile
  getById: (userId) => api.get(`/users/${userId}`),

  // Block / unblock a user
  blockUser:   (userId) => api.post(`/users/block/${userId}`),
  unblockUser: (userId) => api.post(`/users/unblock/${userId}`),
};

// ─── Post / Feed Service ──────────────────────────────────────
export const postService = {
  getFeed:          (page, limit)              => api.get('/posts', { params: { page, limit } }),
  getUserPosts:     (userId, limit)           => api.get(`/posts/user/${userId}`, { params: limit ? { limit } : {} }),
  getUserActivity:  (userId, limit)           => api.get(`/posts/activity/${userId}`, { params: limit ? { limit } : {} }),
  createPost:       (formData)                => api.post('/posts', formData),
  editPost:         (postId, content)         => api.put(`/posts/${postId}`, { content }),
  likePost:         (postId)                  => api.put(`/posts/${postId}/like`),
  addComment:       (postId, content)         => api.post(`/posts/${postId}/comment`, { content }),
  deleteComment:    (postId, commentId)       => api.delete(`/posts/${postId}/comment/${commentId}`),
  deletePost:       (postId)                  => api.delete(`/posts/${postId}`),
  reportPost:       (postId)                  => api.post(`/posts/${postId}/report`),
};

// ─── Job Service ──────────────────────────────────────────────
export const jobService = {
  getJobs:        ()         => api.get('/jobs'),
  getPendingJobs: ()         => api.get('/jobs/pending'),
  createJob:      (data)     => api.post('/jobs', data),
  applyJob:       (jobId)    => api.put(`/jobs/${jobId}/apply`),
  approveJob:     (jobId)    => api.put(`/jobs/${jobId}/approve`),
  rejectJob:      (jobId)    => api.put(`/jobs/${jobId}/reject`),
  deleteJob:      (jobId)    => api.delete(`/jobs/${jobId}`),
  // Admin full control
  adminGetAll:    (params)   => api.get('/jobs/admin/all', { params }),
  editJob:        (id, data) => api.put(`/jobs/${id}`, data),
  getApplicants:  (id)       => api.get(`/jobs/${id}/applicants`),
};

// ─── Event Service ────────────────────────────────────────────
export const eventService = {
  getEvents:        ()         => api.get('/events'),
  getPendingEvents: ()         => api.get('/events/pending'),
  createEvent:      (data)     => api.post('/events', data),
  toggleRegister:   (eventId)  => api.put(`/events/${eventId}/register`),
  approveEvent:     (eventId)  => api.put(`/events/${eventId}/approve`),
  rejectEvent:      (eventId)  => api.put(`/events/${eventId}/reject`),
  deleteEvent:      (eventId)  => api.delete(`/events/${eventId}`),
  // Admin full control
  adminGetAll:      (params)   => api.get('/events/admin/all', { params }),
  editEvent:        (id, data) => api.put(`/events/${id}`, data),
  getAttendees:     (id)       => api.get(`/events/${id}/attendees`),
};

// ─── Notification Service ─────────────────────────────────────
export const notificationService = {
  getNotifications: () => api.get('/notifications'),
  markRead:         (id) => api.put(`/notifications/${id}/read`),
  markAllRead:      ()  => api.put('/notifications/read-all'),
  delete:           (id) => api.delete(`/notifications/${id}`),
  clearAll:         ()  => api.delete('/notifications/clear-all'),
  getUnreadCount:   ()  => api.get('/notifications/unread-count'),
};

// ─── Chat / Messaging Service ─────────────────────────────────
export const chatService = {
  fetchChats:    ()              => api.get('/chat'),
  fetchMessages: (chatId, page = 1, limit = 50) => api.get(`/chat/${chatId}/messages?page=${page}&limit=${limit}`),
  accessChat:    (userId)        => api.post('/chat', { userId }),
  searchUsers:   (searchQuery)   => api.get(`/chat/users/search?q=${searchQuery}`),
  sendMessage:   (chatId, text)  => api.post(`/chat/${chatId}/messages`, { text }),
  getUnreadCounts: ()            => api.get('/chat/unread-count'),
  getUnreadMessages: ()          => api.get('/chat/unread'),
  markChatRead:  (chatId)        => api.put(`/chat/${chatId}/read`),
  clearChat:     (chatId)        => api.delete(`/chat/${chatId}/clear`),
};

// ─── Connections Service ──────────────────────────────────────
export const connectionService = {
  getRequests:      ()       => api.get('/connections/requests'),
  getSentRequests:  ()       => api.get('/connections/sent-requests'), // outgoing pending
  sendRequest:      (userId) => api.post(`/connections/request/${userId}`),
  acceptRequest:    (reqId)  => api.put(`/connections/accept/${reqId}`),
  rejectRequest:    (reqId)  => api.put(`/connections/reject/${reqId}`),
  removeConnection: (userId) => api.delete(`/connections/remove/${userId}`),
  getStatus:        (userId) => api.get(`/connections/status/${userId}`),
  getMyConnections: ()       => api.get('/connections/my-connections'),
  getSuggestions:   (params) => api.get('/connections/suggestions', { params })
};

// ─── Admin Service ────────────────────────────────────────────
export const adminService = {
  getPendingAlumni: ()           => api.get('/admin/pending-alumni'),
  getPendingCount:  ()           => api.get('/admin/pending-alumni').then(r => (r.data?.data || r.data || []).length).catch(() => 0),
  activateUser:     (userId)     => api.put(`/admin/activate/${userId}`),
  rejectUser:       (userId)     => api.delete(`/admin/reject/${userId}`),
  getStats:         ()           => api.get('/admin/stats'),
  getAnalytics:     ()           => api.get('/admin/analytics'),

  // Alumni CRUD
  getAlumni:        (params)     => api.get('/admin/alumni', { params }),
  updateAlumni:     (id, data)   => api.put(`/admin/alumni/${id}`, data),
  deleteAlumni:     (id)         => api.delete(`/admin/alumni/${id}`),
  approveAlumni:    (id)         => api.put(`/admin/activate/${id}`),
  rejectAlumni:     (id)         => api.put(`/admin/reject-alumni/${id}`),

  // Post Moderation
  getModerationPosts: (params)   => api.get('/admin/posts', { params }),
  deletePost:         (id)       => api.delete(`/admin/posts/${id}`),
  toggleHidePost:     (id)       => api.put(`/admin/posts/${id}/hide`),
  dismissReports:     (id)       => api.put(`/admin/posts/${id}/dismiss-reports`),
  banUser:            (userId)   => api.put(`/admin/ban-user/${userId}`),

  // Broadcast
  sendBroadcast: (data)          => api.post('/admin/broadcast', data),
  getBatches:    ()              => api.get('/admin/batches'),

  // Role Management
  getUsersWithRoles: (params)         => api.get('/admin/users/roles', { params }),
  updateUserRole:    (id, role)       => api.put(`/admin/users/${id}/role`, { role }),

  // Staff Management
  getPendingStaff:     ()               => api.get('/admin/pending-staff'),
  approveStaff:        (userId)         => api.post('/admin/approve-staff', { userId, action: 'approve' }),
  rejectPendingStaff:  (userId)         => api.post('/admin/approve-staff', { userId, action: 'reject' }),
  getStaff:            (params)         => api.get('/admin/staff', { params }),
  updateStaff:         (id, data)       => api.put(`/admin/staff/${id}`, data),
  deleteStaff:         (id)             => api.delete(`/admin/staff/${id}`),
  rejectApprovedStaff: (id)             => api.put(`/admin/reject-staff/${id}`),

  // System Config
  getSystemConfig:    ()             => api.get('/admin/system-config'),
  updateSystemConfig: (data)         => api.put('/admin/system-config', data),

  // Imported (bulk) users — read-only monitoring view
  getImportedUsers: (params)         => api.get('/admin/imported-users', { params }),

  // Quick-add alumni (from AdminHome modal)
  addAlumni: (data)                  => api.post('/admin/alumni', data),
};

// ─── Landing Page CMS Service ─────────────────────────────────
export const landingService = {
  // Public
  getSections:         ()              => api.get('/landing'),

  // Admin
  getAdminSections:    ()              => api.get('/landing/admin'),
  createSection:       (data)          => api.post('/landing/admin/sections', data),
  updateSection:       (key, data)     => api.put(`/landing/admin/sections/${key}`, data),
  deleteSection:       (key)           => api.delete(`/landing/admin/sections/${key}`),
  toggleSection:       (key)           => api.put(`/landing/admin/sections/${key}/toggle`),
  reorderSections:     (orderArr)      => api.put('/landing/admin/reorder', { order: orderArr }),
  addItem:             (key, fields)   => api.post(`/landing/admin/sections/${key}/items`, { fields }),
  deleteItem:          (key, itemId)   => api.delete(`/landing/admin/sections/${key}/items/${itemId}`),
};

// ─── Student Admin Service ────────────────────────────────────
export const studentAdminService = {
  getStudents:      (params)             => api.get('/admin/students', { params }),
  addStudent:       (data)               => api.post('/admin/students', data),
  updateStudent:    (id, data)           => api.put(`/admin/students/${id}`, data),
  deleteStudent:    (id)                 => api.delete(`/admin/students/${id}`),
  promoteToAlumni:  (id)                 => api.put(`/admin/students/${id}/promote`),
  bulkImport:       (formData)           => api.post('/admin/students/bulk-import', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  importUnified:    (formData, type, preview = false) =>
    api.post(`/admin/import?type=${type}&preview=${preview}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  triggerGraduation: () => api.post('/admin/graduation/run'),
};

// ─── Staff / Coordinator Service ──────────────────────────────
export const staffService = {
  getStudents:  (params) => api.get('/staff/students',   { params }),
  getAnalytics: ()       => api.get('/staff/analytics'),
  getJobReport: ()       => api.get('/staff/job-report'),
};

// ─── Mentorship Service ───────────────────────────────────────
export const mentorshipService = {
  registerMentor:      (data)    => api.post('/mentorship/register-mentor', data),
  getMyMentorProfile:  ()        => api.get('/mentorship/me/mentor-profile'),
  getMentors:          (params)  => api.get('/mentorship/mentors', { params }),
  sendRequest:         (data)    => api.post('/mentorship/request', data),
  getMyRequests:       ()        => api.get('/mentorship/my-requests'),
  getIncomingRequests: ()        => api.get('/mentorship/incoming-requests'),
  acceptRequest:       (id)      => api.put(`/mentorship/request/${id}/accept`),
  rejectRequest:       (id)      => api.put(`/mentorship/request/${id}/reject`),
  getMySessions:       ()        => api.get('/mentorship/my-sessions'),
  completeSession:     (id, data)=> api.put(`/mentorship/session/${id}/complete`, data),
  submitFeedback:      (id, data)=> api.put(`/mentorship/session/${id}/feedback`, data),
  updateNotes:         (id, data)=> api.put(`/mentorship/session/${id}/notes`, data),
  uploadChatImage:     (chatId, formData) => api.post(`/mentorship/chat/${chatId}/image`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
};

// ─── Legal & Compliance Service ─────────────────────────────────
export const legalService = {
  getContent:    (type)       => api.get(`/legal/${type}`),
  updateContent: (type, data) => api.post(`/legal/admin/${type}`, data),
};

export default api;
