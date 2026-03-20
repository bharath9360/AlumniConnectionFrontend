import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Layout & Context Components
import Navbar from './components/layout/Navbar';
import BottomNav from './components/layout/BottomNav';
import { AuthProvider } from './context/AuthContext';
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

// Unified Authenticated Components0
import UnifiedDashboard from './pages/Dashboard/UnifiedDashboard';
import AlumniDashboard from './pages/Alumni/AlumniDashboard';
import UserProfile from './pages/Profile/UserProfile';
import JobPostings from './pages/Home/JobPostings';
import Events from './pages/Home/Events';
import Messaging from './pages/Home/Messaging';
import Notification from './pages/Home/Notification';
import JobSearch from './pages/Student/JobSearch';
import StudentEvents from './pages/Student/StudentEvents';

// Admin Components
import AdminPost from './pages/Admin/AdminPost';
import UpcomingEventsList from './pages/Admin/UpcomingEventsList';
import JobVacancyList from './pages/Admin/JobVacancyList';
import CreateJob from './pages/Admin/CreateJob';
import CreateEvent from './pages/Admin/CreateEvent';
import ViewProfile from './pages/Admin/ViewProfile';
import AdminDashboard from './pages/Admin/AdminDashboard';
import AlumniManagement from './pages/Admin/AlumniManagement';
import ReviewApplication from './pages/Admin/ReviewApplication';
import VerificationSuccess from './pages/Admin/VerificationSuccess';
import JobDetailsView from './pages/Admin/JobDetailsView';
import AddAlumni from './pages/Admin/AddAlumni';
import ViewEventDetail from './pages/Admin/ViewEventDetail';

// Global Styles
import { storage } from './utils/storage';
import './styles/Global.css';
import './styles/Dashboard.css';

// Initialize persistent storage
try {
  storage.init();
} catch (e) {
  console.error('Failed to initialize storage:', e);
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App d-flex flex-column min-vh-100">
          <Navbar />
          <main className="flex-grow-1 pb-lg-0 pb-5 mb-3 mb-lg-0">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<HomeScreen />} />
              <Route path="/about" element={<AboutUs />} />
              <Route path="/contact" element={<ContactUs />} />
              <Route path="/success" element={<ResponseSubmitted />} />

              {/* Auth Routes */}
              <Route path="/register" element={<RoleSelection />} />
              <Route path="/signup/student" element={<StudentSignUp />} />
              <Route path="/signup/alumni" element={<AlumniSignUp />} />
              <Route path="/signup/admin" element={<AdminSignUp />} />
              <Route path="/login" element={<LoginRoleSelection />} />
              <Route path="/login/student" element={<StudentLogin />} />
              <Route path="/login/alumni" element={<AlumniLogin />} />
              <Route path="/login/admin" element={<AdminLogin />} />
              <Route path="/alumni/home" element={<AlumniDashboard />} />
              <Route path="/alumni/profile" element={<UserProfile />} />
              <Route path="/jobs" element={<JobPostings />} />
              <Route path="/Student/JobSearch" element={<JobSearch />} />
              <Route path="/student/StudentEvents" element={<StudentEvents />} />
              <Route path="/events" element={<Events />} />
              <Route path="/messaging" element={<Messaging />} />
              <Route path="/notifications" element={<Notification />} />

              {/* Protected Routes - All Authenticated Users */}
              <Route element={<ProtectedRoute />}>
                <Route path="/alumni/home" element={<AlumniDashboard />} />
                <Route path="/alumni/profile" element={<UserProfile />} />
                <Route path="/jobs" element={<JobPostings />} />
                <Route path="/events" element={<Events />} />
                <Route path="/messaging" element={<Messaging />} />
                <Route path="/notifications" element={<Notification />} />
              </Route>

              {/* Protected Routes - Admin Only */}
              <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
                <Route path="/admin/home" element={<UnifiedDashboard />} />
                <Route path="/admin/profile" element={<UserProfile />} />
                <Route path="/admin/dashboard" element={<AdminDashboard />} />
                <Route path="/admin/post" element={<AdminPost />} />
                <Route path="/admin/upcoming-events-list" element={<UpcomingEventsList />} />
                <Route path="/admin/create-event" element={<CreateEvent />} />
                <Route path="/admin/job-vacancies" element={<JobVacancyList />} />
                <Route path="/admin/create-job" element={<CreateJob />} />
                <Route path="/admin/alumni" element={<AlumniManagement />} />
                <Route path="/admin/review-application" element={<ReviewApplication />} />
                <Route path="/admin/verify-success" element={<VerificationSuccess />} />
                <Route path="/admin/view-profile" element={<ViewProfile />} />
                <Route path="/admin/job-details" element={<JobDetailsView />} />
                <Route path="/admin/add-alumni" element={<AddAlumni />} />
                <Route path="/admin/view-event" element={<ViewEventDetail />} />
              </Route>

            </Routes>
          </main>
          <BottomNav />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;