// src/pages/Home/HomeScreen.js
import React from 'react';
import StatCard from '../../components/cards/StatCard';
import '../../styles/Home.css';

const HomeScreen = () => {
  return (
    <main>
      {/* Hero Section */}
      <section className="hero-section d-flex align-items-center justify-content-center text-white">
        <div className="hero-overlay"></div>
        <h1 className="display-3 fw-bold z-1 text-center">Connect With MAMCET</h1>
      </section>

      {/* Vision Section */}
      <section className="py-5 text-white" style={{backgroundColor: 'var(--custom-red)'}}>
        <div className="container">
          <h4 className="text-center fw-bold mb-4">ALUMNI PLATFORM VISION</h4>
          <div className="row border-top border-bottom py-4">
            <StatCard value="5000+" label="Members" />
            <StatCard value="18+" label="Batches" />
            <StatCard value="70+" label="Companies" />
          </div>
        </div>
      </section>

      {/* Key Benefits */}
      <section id="about" className="py-5 bg-light">
        <div className="container text-center">
          <h2 className="display-6 fw-bold mb-5">Key Benefits</h2>
          <div className="row g-4">
            {/* Reconnect Card */}
            <div className="col-md-3">
              <div className="card h-100 p-4 border-0 shadow-sm benefit-card">
                <i className="fas fa-sync-alt fa-3x mb-3" style={{color: 'var(--custom-red)'}}></i>
                <h5 className="fw-bold">Reconnect</h5>
                <p className="text-muted small">Reminisce about college days and build lasting relationships with old friends.</p>
              </div>
            </div>
            {/* மற்ற கார்டுகளையும் இதே போல் சேர்க்கலாம் */}
          </div>
        </div>
      </section>
    </main>
  );
};
export default HomeScreen;