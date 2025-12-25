import React from 'react';
import StatCard from '../../components/cards/StatCard';
import '../../styles/Home.css';

/**
 * Dummy Data Lists
 * These will be replaced with API calls after backend integration.
 */
const GALLERY_HIGHLIGHTS = [
  { id: 1, title: "Festa'25", color: "#ffc8dd" },
  { id: 2, title: "Fest'24", color: "#cdb4db" },
  { id: 3, title: "IEEE Event", color: "#bde0fe" },
  { id: 4, title: "Symposium", color: "#a2d2ff" }
];

const SUCCESS_STORIES = [
  {
    id: 1,
    name: "Alumni Student",
    initial: "B",
    rating: 5,
    testimonial: "The MAMCET Alumni Connect platform has been instrumental in reconnecting me with old friends and expanding my professional network. It's a fantastic resource for staying engaged with the college community."
  }
];

const HomeScreen = () => {
  return (
    <div className="homepage-container">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-overlay"></div>
        <div className="hero-content">
          <h1 className="hero-headline">Connect With MAMCET</h1>
        </div>
      </section>

      {/* Vision Section */}
      <section className="vision-container py-5 text-white">
        <div className="container text-center">
          <h5 className="section-subtitle">ALUMNI PLATFORM VISION</h5>
          <div className="stats-grid">
            <StatCard value="5000+" label="Members" />
            <StatCard value="18+" label="Batches" />
            <StatCard value="70+" label="Companies" />
          </div>
        </div>
      </section>

      {/* Gallery Highlights Section */}
      <section className="gallery-section py-5 bg-light">
        <div className="container text-center">
          <h2 className="section-title mb-5">Gallery Highlights</h2>
          <div className="row justify-content-center g-4">
            {GALLERY_HIGHLIGHTS.map((item) => (
              <div key={item.id} className="col-6 col-md-3">
                <div 
                  className="gallery-circle shadow-sm" 
                  style={{ backgroundColor: item.color }}
                >
                  {item.title}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Success Stories Section */}
      <section className="stories-section py-5">
        <div className="container text-center">
          <h2 className="section-title mb-5">Success Stories</h2>
          {SUCCESS_STORIES.map((story) => (
            <div key={story.id} className="story-card card border-0 mx-auto p-5 shadow-lg">
              <div className="story-avatar-top">{story.initial}</div>
              <h5 className="fw-bold mt-3">{story.name}</h5>
              <div className="rating-stars text-warning my-2">
                {[...Array(story.rating)].map((_, i) => (
                  <i key={i} className="fas fa-star mx-1"></i>
                ))}
              </div>
              <p className="testimonial-text text-muted fst-italic">
                "{story.testimonial}"
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Professional Footer */}
      <footer className="footer-area bg-dark text-white py-5 mt-5" id="contact">
        <div className="container text-center">
          <p className="mb-2">For direct inquiries, contact us at <a href="mailto:alumni@mamcet.com" className="brand-link">alumni@mamcet.com</a></p>
          <p className="mb-2">Phone: <span className="fw-bold">8088077077</span></p>
          <p className="mb-4">Address: <span className="fw-bold">Chennai Trunk Road, Siruganur, Trichy - 621105</span></p>
          <hr className="bg-secondary" />
          <p className="text-muted small mt-4">© 2025 MAMCET Alumni Connect. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default HomeScreen;