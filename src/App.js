// src/App.js
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

// அட்மின் டேஷ்போர்டை இங்கே இம்போர்ட் செய்கிறோம்
import AdminDashboard from './pages/Admin/AdminDashboard'; 

// Global Styles (இது கடைசியாக இருக்க வேண்டும்)
import './styles/Global.css';

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

            
            <Route path="/admin/home" element={<AdminDashboard />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;