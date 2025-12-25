// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/layout/Navbar';
import HomeScreen from './pages/Home/HomeScreen';
import './styles/Global.css';

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<HomeScreen />} />
        {}
      </Routes>
    </Router>
  );
}

export default App;