// src/pages/Static/ContactUs.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const ContactUs = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });

  const handleSubmit = (e) => {
    e.preventDefault();
    // Logic for form submission goes here
    console.log("Form Submitted:", formData);
    navigate('/success'); // Redirect to success page as per requirement
  };

  return (
    <div className="container py-5">
      <h2 className="text-center fw-bold mb-5" style={{ color: '#c84022' }}>Contact Us</h2>
      <div className="row justify-content-center">
        <div className="col-md-6 card p-4 shadow-sm border-0">
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label fw-bold">Full Name</label>
              <input 
                type="text" 
                className="form-control" 
                required 
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
            </div>
            <div className="mb-3">
              <label className="form-label fw-bold">Email Address</label>
              <input 
                type="email" 
                className="form-control" 
                required 
                onChange={(e) => setFormData({...formData, email: e.target.value})}
              />
            </div>
            <div className="mb-3">
              <label className="form-label fw-bold">Message</label>
              <textarea 
                className="form-control" 
                rows="4" 
                required 
                onChange={(e) => setFormData({...formData, message: e.target.value})}
              ></textarea>
            </div>
            <button type="submit" className="btn w-100 py-2 fw-bold text-white" style={{ backgroundColor: '#c84022' }}>
              Send Message
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ContactUs;