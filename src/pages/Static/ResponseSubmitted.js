import React from 'react';
import { Link } from 'react-router-dom';
import '../../styles/ResponseSubmitted.css';

/**
 * ResponseSubmitted Component
 * A professional success page displayed after a user successfully submits a form.
 * Features a visual confirmation and a call-to-action to return home.
 */
const ResponseSubmitted = () => {
  return (
    <div className="success-page-container d-flex align-items-center justify-content-center">
      <div className="success-card shadow-lg text-center p-5">
        <div className="success-icon-wrapper mb-4">
          <i className="fas fa-check-circle fa-5x"></i>
        </div>
        <h1 className="success-title fw-bold">THANK YOU!</h1>
        <p className="success-message text-muted mb-4">
          Your message has been successfully submitted. Our team will review your inquiry 
          and get back to you shortly.
        </p>
        <Link to="/" className="btn btn-custom-red px-5 py-2 fw-bold text-white">
          BACK TO HOME
        </Link>
      </div>
    </div>
  );
};

export default ResponseSubmitted;