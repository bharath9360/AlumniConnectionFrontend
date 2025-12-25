// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Layout Components
import Navbar from './components/layout/Navbar';

// Page Components
import HomeScreen from './pages/Home/HomeScreen';
import AboutUs from './pages/Static/AboutUs';
import ContactUs from './pages/Static/ContactUs';
import ResponseSubmitted from './pages/Static/ResponseSubmitted';

// Global Styles
import './styles/Global.css';

/**
 * Main Application Component
 * Managing routes for Home, About, and Contact pages as per design requirements.
 */
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
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;