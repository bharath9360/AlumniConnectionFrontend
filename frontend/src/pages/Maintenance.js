import React from 'react';

const Maintenance = () => {
  return (
    <div className="d-flex flex-column justify-content-center align-items-center vh-100 bg-light text-center px-3">
      <h1 
        className="fw-bold mb-3" 
        style={{ color: '#c84022', fontSize: '3rem' }}
      >
        We'll be back soon
      </h1>
      <h4 className="mb-4 text-dark fw-semibold">System under maintenance</h4>
      <p className="text-muted mb-4 fs-5" style={{ maxWidth: '600px' }}>
        We are currently performing scheduled maintenance to improve your experience. 
        Please check back later.
      </p>
      
      <div 
        className="p-4 bg-white shadow-sm border" 
        style={{ borderRadius: '12px', maxWidth: '400px', width: '100%' }}
      >
        <h6 className="fw-bold mb-2">Need immediate assistance?</h6>
        <p className="text-muted small mb-0">
          Contact the site administrator at <br/>
          <a href="mailto:admin@mamcet.com" style={{ color: '#c84022', textDecoration: 'none' }}>admin@mamcet.com</a>
        </p>
      </div>
    </div>
  );
};

export default Maintenance;
