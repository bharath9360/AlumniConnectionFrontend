import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Layout Components
import Navbar from './components/layout/Navbar';

// Page Components
import HomeScreen from './pages/Home/HomeScreen';
import AlumniDashboard from './pages/Home/AlumniDashboard';
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
import JobPostings from './pages/Home/JobPostings';
import CreateEvent from './pages/Admin/CreateEvent';
import Events from './pages/Home/Events';
import Messaging from './pages/Home/Messaging';

// --- Admin Pages Import ---
import AdminHome from './pages/Admin/AdminHome';
import AdminPost from './pages/Admin/AdminPost';
import UpcomingEventsList from './pages/Admin/UpcomingEventsList';
import JobVacancyList from './pages/Admin/JobVacancyList';
import CreateJob from './pages/Admin/CreateJob';
import ViewProfile from './pages/Admin/ViewProfile';
import AdminDashboard from './pages/Admin/AdminDashboard'; // Dashboard Import

// --- Alumni Management Import ---
import AlumniManagement from './pages/Admin/AlumniManagement';
import ReviewApplication from './pages/Admin/ReviewApplication';
import VerificationSuccess from './pages/Admin/VerificationSuccess';
import JobDetailsView from './pages/Admin/JobDetailsView';
import AddAlumni from './pages/Admin/AddAlumni';
import ViewEventDetail from './pages/Admin/ViewEventDetail';
// Global Styles
import './styles/Global.css';

function App() {
  return (
    <Router>
      <div className="app-container">
        <Navbar />
        <main className="main-content">
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<HomeScreen />} />
            <Route path="/about" element={<AboutUs />} />
            <Route path="/contact" element={<ContactUs />} />
            <Route path="/success" element={<ResponseSubmitted />} />
            <Route path="/register" element={<RoleSelection />} />
            <Route path="/signup/student" element={<StudentSignUp />} />
            <Route path="/signup/alumni" element={<AlumniSignUp />} />
            <Route path="/signup/admin" element={<AdminSignUp />} />
            <Route path="/login" element={<LoginRoleSelection />} />
            <Route path="/login/student" element={<StudentLogin />} />
            <Route path="/login/alumni" element={<AlumniLogin />} />
            <Route path="/login/admin" element={<AdminLogin />} />
            <Route path="/alumni/home" element={<AlumniDashboard />} />
            <Route path="/jobs" element={<JobPostings />} />
            <Route path="/events" element={<Events />} />
            <Route path="/messaging" element={<Messaging />} />
            <Route path="/notifications" element={<div className="container py-5"><h4>Notifications coming soon...</h4></div>} />

            {/* Admin Routes - Sorted */}
            <Route path="/admin/home" element={<AdminHome />} />
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
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;