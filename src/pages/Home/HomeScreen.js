import React from 'react';
import StatCard from '../../components/cards/StatCard';
import '../../styles/Home.css';

/**
 * HomeScreen Component
 * Represents the finalized landing page based on design image_187c80.jpg and image_188360.png.
 */
const GALLERY_ITEMS = [
  { id: 1, title: "Festa'25", color: "#ffc8dd" },
  { id: 2, title: "Fest'24", color: "#cdb4db" },
  { id: 3, title: "IEEE Event", color: "#bde0fe" },
  { id: 4, title: "Symposium", color: "#a2d2ff" }
];

const HomeScreen = () => {
  return (
    <div className="homepage-wrapper">
      {/* Hero Section - White bold title centered on college background */}
      <section className="hero-landing">
        <div className="hero-mask"></div>
        <h1 className="hero-main-headline">Connect With MAMCET</h1>
      </section>

      {/* Vision Section - Red background with white dividers and stats */}
      <section className="vision-highlight-section py-5 text-white">
        <div className="container text-center">
          <h6 className="fw-bold mb-4">ALUMNI PLATFORM VISION</h6>
          <div className="stats-border-top"></div>
          <div className="row py-4">
            <StatCard value="5000+" label="Members" />
            <StatCard value="18+" label="Batches" />
            <StatCard value="70+" label="Companies" />
          </div>
          <div className="stats-border-bottom"></div>
        </div>
      </section>

      {/* Key Benefits Grid */}
      <section id="about" className="benefits-container py-5">
        <div className="container text-center">
          <h2 className="section-title-main">Key Benefits</h2>
          <p className="text-muted mb-5">Discover the advantages of joining our Alumni Network.</p>
          <div className="row g-4">
            <BenefitFeature icon="fa-sync-alt" title="Reconnect" desc="Reminisce about college days and build lasting relationships with old friends." />
            <BenefitFeature icon="fa-briefcase" title="Opportunities" desc="Explore exclusive job postings and advance your career through our network." />
            <BenefitFeature icon="fa-calendar-alt" title="Events & Reunion" desc="Participate in college events, reunions, and stay updated with the community." />
            <BenefitFeature icon="fa-trophy" title="Achievements" desc="Celebrate alumni success stories and engage with our accomplished graduates." />
          </div>
        </div>
      </section>

      {/* Upcoming Events Section - Styled cards with color banners */}
      <section className="events-container py-5 bg-light">
        <div className="container text-center">
          <h2 className="section-title-main">Upcoming Events</h2>
          <div className="row g-4 mt-4">
            <EventCardDisplay bgColor="#a2d2ff" tag="Summer Event" title="Alumni Network Night" />
            <EventCardDisplay bgColor="#bde0fe" tag="Annual Meet" title="Annual Alumni Meet" />
            <EventCardDisplay bgColor="#ffafcc" tag="Career Fair" title="Campus Career Fair" />
          </div>
        </div>
      </section>

      {/* Gallery Highlights - Professional circular design */}
      <section className="gallery-container py-5 text-center">
        <div className="container">
          <h2 className="section-title-main mb-5">Gallery Highlights</h2>
          <div className="row justify-content-center g-4">
            {GALLERY_ITEMS.map(item => (
              <div key={item.id} className="col-6 col-md-3">
                <div className="gallery-circle-box shadow-sm" style={{ backgroundColor: item.color }}>
                  {item.title}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Success Stories - Floating avatar card design */}
      <section className="testimonials-container py-5 bg-light">
        <div className="container text-center">
          <h2 className="section-title-main mb-5">Success Stories</h2>
          <div className="testimonial-profile-card shadow bg-white p-5 mx-auto">
            <div className="profile-avatar-floating">B</div>
            <h5 className="fw-bold mt-4">Alumni Student</h5>
            <div className="rating-star-box text-warning my-2">
              <i className="fas fa-star mx-1"></i><i className="fas fa-star mx-1"></i><i className="fas fa-star mx-1"></i><i className="fas fa-star mx-1"></i><i className="fas fa-star mx-1"></i>
            </div>
            <p className="testimonial-content text-muted fst-italic">
              "The MAMCET Alumni Connect platform has been instrumental in reconnecting me with old friends and expanding my professional network. It's a fantastic resource for staying engaged with the college community."
            </p>
          </div>
        </div>
      </section>

      {/* Final Footer Section - Dark background with brand inquiry info */}
      <footer className="footer-site-main bg-dark text-white py-5" id="contact">
        <div className="container text-center">
          <p className="mb-2">For direct inquiries, contact us at <a href="mailto:alumni@mamcet.com" className="brand-red-link">alumni@mamcet.com</a></p>
          <p className="mb-2">Phone: <span className="fw-bold">8088077077</span></p>
          <p className="mb-4">Address: <span className="fw-bold">Chennai Trunk Road, Siruganur, Trichy - 621105</span></p>
          <p className="text-white-50 extra-small mt-4">© 2025 MAMCET Alumni Connect. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

/* Sub-components for cleaner structure */
const BenefitFeature = ({ icon, title, desc }) => (
  <div className="col-md-3">
    <div className="benefit-item-card h-100 p-4 border-0 shadow-sm bg-white">
      <i className={`fas ${icon} fa-3x brand-primary-color mb-3`}></i>
      <h6 className="fw-bold">{title}</h6>
      <p className="small text-muted mb-0">{desc}</p>
    </div>
  </div>
);

const EventCardDisplay = ({ bgColor, tag, title }) => (
  <div className="col-md-4">
    <div className="event-item-box shadow-sm rounded bg-white overflow-hidden">
      <div className="event-color-header" style={{ backgroundColor: bgColor }}>{tag}</div>
      <div className="p-3">
        <h6 className="fw-bold mb-1">{title}</h6>
        <p className="text-muted small">Connect with fellow alumni and grow your professional network.</p>
      </div>
    </div>
  </div>
);

export default HomeScreen;