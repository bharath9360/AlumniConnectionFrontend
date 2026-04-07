import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="d-flex flex-column justify-content-center align-items-center vh-100 bg-light text-center px-3">
      <h1 
        className="display-1 fw-bold" 
        style={{ color: '#c84022', fontSize: '10rem', lineHeight: '1' }}
      >
        404
      </h1>
      <h3 className="mb-3 text-dark fw-semibold">Page Not Found</h3>
      <p className="text-muted mb-4 fs-5" style={{ maxWidth: '500px' }}>
        The page you are looking for doesn’t exist or has been moved.
      </p>
      <div className="d-flex gap-3 flex-wrap justify-content-center">
        <Link 
          to="/" 
          className="btn text-white px-4 py-2 fw-semibold shadow-sm"
          style={{ backgroundColor: '#c84022', borderRadius: '8px' }}
        >
          Go Home
        </Link>
        <button 
          onClick={() => navigate(-1)} 
          className="btn btn-outline-secondary px-4 py-2 fw-semibold shadow-sm"
          style={{ borderRadius: '8px' }}
        >
          Go Back
        </button>
      </div>
    </div>
  );
};

export default NotFound;
