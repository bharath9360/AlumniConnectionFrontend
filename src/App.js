// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Layout & Styles
import Navbar from './components/layout/Navbar';
import './styles/Global.css';

// Auth Pages
import RoleSelection from './pages/Auth/RoleSelection';
import StudentSignUp from './pages/Auth/StudentSignUp';
import AlumniSignUp from './pages/Auth/AlumniSignUp';
import AdminSignUp from './pages/Auth/AdminSignUp';
import LoginRoleSelection from './pages/Auth/LoginRoleSelection';
import StudentLogin from './pages/Auth/StudentLogin';
import AlumniLogin from './pages/Auth/AlumniLogin';
import AdminLogin from './pages/Auth/AdminLogin';

// Home & Feature Pages
import HomeScreen from './pages/Home/HomeScreen';
import AlumniDashboard from './pages/Home/AlumniDashboard';
import JobPostings from './pages/Home/JobPostings';
import Events from './pages/Home/Events';
import CreateEvent from './pages/Admin/CreateEvent';

// அட்மின் டேஷ்போர்டு (இதை நாம் உருவாக்கப் போகிறோம்)
import AdminDashboard from './pages/Admin/AdminDashboard'; 

// Static Pages
import AboutUs from './pages/Static/AboutUs';
import ContactUs from './pages/Static/ContactUs';
import ResponseSubmitted from './pages/Static/ResponseSubmitted';

function App() {
  return (
    <Router>
      <div className="app-container">
        <Navbar />
        <main className="main-content">
          <Routes>
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
            <Route path="/admin/create-event" element={<CreateEvent />} />
            <Route path="/events" element={<Events />} />
            
            {/* அட்மின் ஹோம் ரூட் */}
            <Route path="/admin/home" element={<AdminDashboard />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;