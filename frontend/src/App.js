import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useParams } from 'react-router-dom';

// Layout & Context Components
import Navbar from './components/layout/Navbar';
import BottomNav from './components/layout/BottomNav';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { MessageProvider } from './context/MessageContext';
import ProtectedRoute from './components/routing/ProtectedRoute';

// Public Page Components
import HomeScreen from './pages/Home/HomeScreen';
import AboutUs from './pages/Static/AboutUs';
import ContactUs from './pages/Static/ContactUs';
import ResponseSubmitted from './pages/Static/ResponseSubmitted';
import RoleSelection from './pages/Auth/RoleSelection';
import StudentSignUp from './pages/Auth/StudentSignUp';
import AlumniSignUp from './pages/Auth/AlumniSignUp';
import AdminSignUp from './pages/Auth/AdminSignUp';
import LoginRoleSelection from './pages/Auth/LoginRoleSelection';
import StudentLogin from './pages/Auth/StudentLogin';
import AlumniLogin from './pages/Auth/AlumniLogin';
import AdminLogin from './pages/Auth/AdminLogin';
import StaffSignUp from './pages/Auth/StaffSignUp';
import StaffLogin from './pages/Auth/StaffLogin';
import AdminLoginPage from './pages/Auth/AdminLoginPage';
import Mentorship from './pages/Mentorship/Mentorship';

// Unified Profile (own-edit + public-view merged)
import Profile from './pages/Profile/Profile';
import ProfilePosts from './pages/Profile/ProfilePosts';
import ProfileActivity from './pages/Profile/ProfileActivity';

// Role-Specific Dashboards
import AlumniDashboard from './pages/Alumni/AlumniDashboard';
import StudentDashboard from './pages/Student/StudentDashboard';
import AdminHome from './pages/Admin/AdminHome';
import StaffDashboard from './pages/Staff/StaffDashboard';

// Shared Protected Pages
import JobPostings from './pages/Home/JobPostings';
import Events from './pages/Home/Events';
import JobsAndEvents from './pages/Home/JobsAndEvents';
import Messaging from './pages/Home/Messaging';
import Notification from './pages/Home/Notification';
import Network from './pages/Home/Network';

// Student Pages
import JobSearch from './pages/Student/JobSearch';
import StudentEvents from './pages/Student/StudentEvents';

// Admin Pages (Legacy — kept for backward compat)
import AdminPost from './pages/Admin/AdminPost';
import UpcomingEventsList from './pages/Admin/UpcomingEventsList';
import JobVacancyList from './pages/Admin/JobVacancyList';
import CreateJob from './pages/Admin/CreateJob';
import CreateEvent from './pages/Admin/CreateEvent';
import ViewProfile from './pages/Admin/ViewProfile';
import AdminApprovals from './pages/Admin/AdminApprovals';
import AlumniManagement from './pages/Admin/AlumniManagement';
import ReviewApplication from './pages/Admin/ReviewApplication';
import VerificationSuccess from './pages/Admin/VerificationSuccess';
import JobDetailsView from './pages/Admin/JobDetailsView';
import AddAlumni from './pages/Admin/AddAlumni';
import ViewEventDetail from './pages/Admin/ViewEventDetail';

// ── Admin Panel (new layout with sidebar) ────────────────────────
import AdminLayout from './components/admin/AdminLayout';
import AdminPanelDashboard from './pages/Admin/AdminPanelDashboard';
import AdminAlumni from './pages/Admin/AdminAlumni';
import AdminStudents from './pages/Admin/AdminStudents';
import GroupManagementPanel from './pages/Admin/GroupManagementPanel';
import AdminPosts from './pages/Admin/AdminPosts';
import AdminJobs from './pages/Admin/AdminJobs';
import AdminEvents from './pages/Admin/AdminEvents';
import AdminLanding from './pages/Admin/AdminLanding';
import AdminSettings from './pages/Admin/AdminSettings';
import BulkImportPage from './pages/Admin/BulkImportPage';
import AdminBroadcast from './pages/Admin/AdminBroadcast';

// Global Styles
import './styles/Global.css';
import './styles/Dashboard.css';
import ErrorBoundary from './components/common/ErrorBoundary';

// ─── Route redirect helpers ────────────────────────────────────
// /alumni/profile/:userId or /admin/profile/:userId → /profile/:userId
const NavigateToProfile = () => {
  const { userId } = useParams();
  if (!userId) return <Navigate to="/" replace />;
  return <Navigate to={`/profile/${userId}`} replace />;
};

// /alumni/profile (no param) — redirect to the logged-in user's own profile
const OwnProfileRedirect = () => {
  const { user } = useAuth();
  const uid = user?._id || user?.id;
  if (!uid) return <Navigate to="/login" replace />;
  return <Navigate to={`/profile/${uid}`} replace />;
};


function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <MessageProvider>
          <Router>
          <Routes>
            {/* ════════════════════════════════════════════════════
                Admin Panel — full-screen layout (no global Navbar)
            ════════════════════════════════════════════════════ */}
            <Route element={<ErrorBoundary compact={false}><AdminLayout /></ErrorBoundary>}>
              <Route path="/admin"           element={<Navigate to="/admin/analytics" replace />} />
              <Route path="/admin/dashboard"  element={<AdminPanelDashboard />} />
              <Route path="/admin/analytics"  element={<AdminPanelDashboard />} />
              <Route path="/admin/alumni"     element={<AdminAlumni />} />
              <Route path="/admin/students"   element={<AdminStudents />} />
              <Route path="/admin/groups"     element={<GroupManagementPanel />} />
              <Route path="/admin/approvals"  element={<AdminApprovals />} />
              <Route path="/admin/posts"      element={<AdminPosts />} />
              <Route path="/admin/jobs"       element={<AdminJobs />} />
              <Route path="/admin/events"     element={<AdminEvents />} />
              <Route path="/admin/landing"    element={<AdminLanding />} />
              <Route path="/admin/settings"   element={<AdminSettings />} />
              <Route path="/admin/import"     element={<BulkImportPage />} />
              <Route path="/admin/broadcast"  element={<AdminBroadcast />} />
            </Route>

            {/* ════════════════════════════════════════════════════
                Admin Login — isolated full-screen, no Navbar
            ════════════════════════════════════════════════════ */}
            <Route path="/admin/login" element={<AdminLoginPage />} />

            {/* ════════════════════════════════════════════════════
                Messaging — full-screen layout (NO Navbar/BottomNav)
                Isolated just like the Admin panel above.
            ════════════════════════════════════════════════════ */}
            <Route element={<ProtectedRoute />}>
              <Route path="/messages"         element={<Messaging />} />
              <Route path="/messages/:chatId" element={<Messaging />} />
              {/* Legacy redirects — keep old URLs working */}
              <Route path="/messaging"          element={<Navigate to="/messages" replace />} />
              <Route path="/messaging/:userId"  element={<Navigate to="/messages" replace />} />
            </Route>

            {/* ════════════════════════════════════════════════════
                All other routes — use the global Navbar shell
            ════════════════════════════════════════════════════ */}
            <Route
              path="*"
              element={
                <div className="App d-flex flex-column min-vh-100">
                  <Navbar />
                  <main className="flex-grow-1 pb-lg-0 pb-5 mb-3 mb-lg-0">
                    <ErrorBoundary compact={false}>
                    <Routes>
                      {/* ── Fully Public Routes ───────────────── */}
                      <Route path="/" element={<HomeScreen />} />
                      <Route path="/about" element={<AboutUs />} />
                      <Route path="/contact" element={<ContactUs />} />
                      <Route path="/success" element={<ResponseSubmitted />} />
                      <Route path="/profile/:id" element={<Profile />} />
                      <Route path="/profile/:id/posts" element={<ProfilePosts />} />
                      <Route path="/profile/:id/activity" element={<ProfileActivity />} />

                      {/* ── Auth Routes ───────────────────────── */}
                      <Route path="/register" element={<RoleSelection />} />
                      <Route path="/signup/student" element={<StudentSignUp />} />
                      <Route path="/signup/alumni" element={<AlumniSignUp />} />
                      <Route path="/signup/admin" element={<AdminSignUp />} />
                      <Route path="/signup/staff" element={<StaffSignUp />} />
                      <Route path="/login" element={<LoginRoleSelection />} />
                      <Route path="/login/student" element={<StudentLogin />} />
                      <Route path="/login/alumni" element={<AlumniLogin />} />
                      <Route path="/login/admin" element={<AdminLogin />} />
                      <Route path="/login/staff" element={<StaffLogin />} />

                      {/* ── Protected: Any Authenticated User ─── */}
                      <Route element={<ProtectedRoute />}>
                        <Route path="/alumni/home/:userId" element={<AlumniDashboard />} />
                        <Route path="/student/home/:userId" element={<StudentDashboard />} />
                        <Route path="/alumni/profile/:userId" element={<NavigateToProfile />} />
                        <Route path="/jobs/:userId" element={<JobPostings />} />
                        <Route path="/Student/JobSearch/:userId" element={<JobSearch />} />
                        <Route path="/student/StudentEvents/:userId" element={<StudentEvents />} />
                        <Route path="/events/:userId" element={<Events />} />
                        <Route path="/notifications/:userId" element={<Notification />} />
                      </Route>

                      {/* ── Protected: Staff & Admin ────────────── */}
                      <Route element={<ProtectedRoute allowedRoles={['staff', 'admin']} />}>
                        <Route path="/staff/dashboard" element={<StaffDashboard />} />
                      </Route>

                      {/* ── Protected: Admin Only (legacy /:userId routes) ── */}
                      <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
                        <Route path="/admin/home/:userId" element={<AdminHome />} />
                        <Route path="/admin/profile/:userId" element={<NavigateToProfile />} />
                        <Route path="/admin/dashboard/:userId" element={<Navigate to="/admin/analytics" replace />} />
                        <Route path="/admin/post/:userId" element={<AdminPost />} />
                        <Route path="/admin/upcoming-events-list/:userId" element={<UpcomingEventsList />} />
                        <Route path="/admin/create-event/:userId" element={<CreateEvent />} />
                        <Route path="/admin/job-vacancies/:userId" element={<JobVacancyList />} />
                        <Route path="/admin/create-job/:userId" element={<CreateJob />} />
                        <Route path="/admin/alumni/:userId" element={<AlumniManagement />} />
                        <Route path="/admin/review-application/:userId" element={<ReviewApplication />} />
                        <Route path="/admin/verify-success/:userId" element={<VerificationSuccess />} />
                        <Route path="/admin/view-profile/:userId" element={<ViewProfile />} />
                        <Route path="/admin/job-details/:userId" element={<JobDetailsView />} />
                        <Route path="/admin/add-alumni/:userId" element={<AddAlumni />} />
                        <Route path="/admin/view-event/:userId" element={<ViewEventDetail />} />
                        <Route path="/admin/approvals/:userId" element={<AdminApprovals />} />
                      </Route>

                      {/* ── Protected: Shared (all roles) ──────── */}
                      <Route element={<ProtectedRoute />}>
                        <Route path="/alumni/profile" element={<OwnProfileRedirect />} />
                        <Route path="/opportunities" element={<JobsAndEvents />} />
                        <Route path="/jobs" element={<JobsAndEvents />} />
                        <Route path="/events" element={<JobsAndEvents />} />
                        <Route path="/student/StudentEvents" element={<Navigate to="/opportunities?tab=events" replace />} />
                        <Route path="/Student/JobSearch" element={<Navigate to="/opportunities?tab=jobs" replace />} />
                        <Route path="/network" element={<Network />} />
                        <Route path="/messaging" element={<Messaging />} />
                        <Route path="/notifications" element={<Notification />} />
                        <Route path="/mentorship" element={<Mentorship />} />
                      </Route>
                    </Routes>
                    </ErrorBoundary>
                  </main>
                  <BottomNav />
                </div>
              }
            />
          </Routes>
        </Router>
        </MessageProvider>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;
