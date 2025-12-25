// src/pages/Static/AboutUs.js
import React from 'react';

const AboutUs = () => {
  return (
    <div className="container py-5 text-center">
      <h2 className="fw-bold mb-4" style={{ color: '#c84022' }}>About MAMCET Alumni Connect</h2>
      <p className="lead text-muted mx-auto" style={{ maxWidth: '800px' }}>
        Our Alumni Connect Platform creates a digital bridge between the alumni and students of M.A.M College of Engineering and Technology[cite: 1]. 
        It allows alumni to stay connected, share job opportunities, and explore ongoing college events[cite: 1].
      </p>
      <div className="row mt-5 g-4">
        <div className="col-md-4">
          <div className="card h-100 p-4 border-0 shadow-sm">
            <h5 className="fw-bold">Our Mission</h5>
            <p className="small text-muted">To foster a lifelong connection between the institution and its graduates.</p>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card h-100 p-4 border-0 shadow-sm">
            <h5 className="fw-bold">Networking</h5>
            <p className="small text-muted">A professional space similar to LinkedIn for our college community[cite: 1].</p>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card h-100 p-4 border-0 shadow-sm">
            <h5 className="fw-bold">Legacy</h5>
            <p className="small text-muted">Celebrating over 18 batches of excellence and growth.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutUs;