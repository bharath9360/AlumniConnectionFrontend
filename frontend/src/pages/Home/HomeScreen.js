import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Carousel from 'react-multi-carousel';
import 'react-multi-carousel/lib/styles.css';
import StatCard from '../../components/cards/StatCard';
import '../../styles/Home.css';

// --- DATA ---
const GALLERY_ITEMS = [
  { id: 1, title: "Festa'25", color: "#ffc8dd" },
  { id: 2, title: "Fest'24", color: "#cdb4db" },
  { id: 3, title: "IEEE Event", color: "#bde0fe" },
  { id: 4, title: "Symposium", color: "#a2d2ff" }
];

const EVENTS_DATA = [
  {
    id: 1, tag: "Annual Meet", title: "Alumni Network Night", bgColor: "#a2d2ff",
    date: "April 15, 2026", venue: "MAMCET Main Auditorium, Trichy",
    time: "6:00 PM – 9:00 PM",
    desc: "Reconnect with your batch mates and expand your professional circle at this exclusive Alumni Networking Night. Featuring keynote addresses from distinguished alumni and interactive breakout sessions."
  },
  {
    id: 2, tag: "Annual Event", title: "Annual Alumni Meet 2026", bgColor: "#bde0fe",
    date: "May 20, 2026", venue: "MAMCET Sports Complex, Trichy",
    time: "10:00 AM – 5:00 PM",
    desc: "The biggest gathering of the year! Join us for a day of celebrations, cultural programs, sports activities, and memories that will last a lifetime."
  },
  {
    id: 3, tag: "Career Fair", title: "Campus Career Fair", bgColor: "#ffafcc",
    date: "June 5, 2026", venue: "MAMCET Seminar Hall",
    time: "9:00 AM – 4:00 PM",
    desc: "Top companies recruiting directly from campus. Bring your resume, dress sharp, and walk in with confidence. Open to final-year students and young alumni."
  },
  {
    id: 4, tag: "Webinar", title: "Tech Talks: Future of AI", bgColor: "#caffbf",
    date: "March 28, 2026", venue: "Online (Zoom)",
    time: "3:00 PM – 5:00 PM",
    desc: "An interactive webinar featuring leading AI researchers discussing the future landscape of technology, career opportunities, and research trends in AI & ML."
  },
  {
    id: 5, tag: "Workshop", title: "Full-Stack Bootcamp", bgColor: "#ffd6a5",
    date: "April 8, 2026", venue: "CS Lab, MAMCET",
    time: "9:00 AM – 1:00 PM",
    desc: "A hands-on workshop covering React, Node.js, and MongoDB. Ideal for students looking to build their first full-stack project with production-level guidance."
  }
];

const CAROUSEL_RESPONSIVE = {
  desktop: { breakpoint: { max: 3000, min: 1024 }, items: 3, slidesToSlide: 1 },
  tablet: { breakpoint: { max: 1024, min: 640 }, items: 2, slidesToSlide: 1 },
  mobile: { breakpoint: { max: 640, min: 0 }, items: 1, slidesToSlide: 1 }
};

// Framer motion variants
const heroTextVariants = {
  hidden: { opacity: 0, y: 60 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: 'easeOut' } }
};
const floatVariant = {
  animate: {
    y: [0, -14, 0],
    transition: { duration: 4, repeat: Infinity, ease: 'easeInOut' }
  }
};

// --- MAIN COMPONENT ---
const HomeScreen = () => {
  const [selectedEvent, setSelectedEvent] = useState(null);

  return (
    <div className="homepage-wrapper">

      {/* ===== HERO SECTION with Framer Motion ===== */}
      <section className="hero-landing position-relative overflow-hidden">
        <div className="hero-mask" />

        {/* Animated floating decorative circles */}
        <motion.div
          className="hero-deco-circle hero-deco-circle--1"
          animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="hero-deco-circle hero-deco-circle--2"
          animate={{ scale: [1.1, 0.95, 1.1], opacity: [0.4, 0.2, 0.4] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        />

        <div className="hero-content position-relative z-10 text-center px-3">
          <motion.span
            className="hero-badge d-inline-block px-4 py-2 rounded-pill mb-4 text-white extra-small fw-bold"
            style={{ backgroundColor: 'rgba(200,64,34,0.85)', letterSpacing: '2px' }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            MAMCET ALUMNI NETWORK
          </motion.span>

          <motion.h1
            className="hero-main-headline"
            variants={heroTextVariants}
            initial="hidden"
            animate="visible"
          >
            Connect With MAMCET
          </motion.h1>

          <motion.p
            className="hero-sub-text text-white-50 mt-3 mb-5 mx-auto"
            style={{ maxWidth: '560px', fontSize: '1.1rem', lineHeight: 1.7 }}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            Join 5,000+ alumni, stay connected, discover opportunities and give back to your alma mater.
          </motion.p>

          <motion.div
            className="d-flex justify-content-center gap-3 flex-wrap"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            <Link to="/register" className="btn btn-lg px-5 py-3 fw-bold rounded-pill text-white" style={{ backgroundColor: '#c84022' }}>
              Join Now
            </Link>
            <Link to="/login" className="btn btn-lg px-5 py-3 fw-bold rounded-pill btn-outline-light">
              Log In
            </Link>
          </motion.div>

          {/* Floating animated icon */}
          <motion.div
            className="hero-scroll-indicator mt-5"
            variants={floatVariant}
            animate="animate"
          >
            <i className="fas fa-chevron-down text-white-50" style={{ fontSize: '1.5rem' }}></i>
          </motion.div>
        </div>
      </section>

      {/* ===== VISION / STATS SECTION ===== */}
      <section className="vision-highlight-section py-5 text-white">
        <div className="container text-center">
          <h6 className="fw-bold mb-4" style={{ letterSpacing: '2px' }}>ALUMNI PLATFORM VISION</h6>
          <div className="stats-border-top"></div>
          <div className="row py-4">
            <StatCard value="5000+" label="Members" />
            <StatCard value="18+" label="Batches" />
            <StatCard value="70+" label="Companies" />
          </div>
          <div className="stats-border-bottom"></div>
        </div>
      </section>

      {/* ===== KEY BENEFITS GRID ===== */}
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

      {/* ===== EVENTS CAROUSEL (react-multi-carousel) ===== */}
      <section className="events-container py-5 bg-light">
        <div className="container-fluid px-4">
          <div className="text-center mb-5">
            <h2 className="section-title-main">Upcoming Events</h2>
            <p className="text-muted">Click on an event card to see full details and RSVP.</p>
          </div>
          <Carousel
            responsive={CAROUSEL_RESPONSIVE}
            infinite
            autoPlay
            autoPlaySpeed={3500}
            keyBoardControl
            transitionDuration={500}
            containerClass="carousel-container pb-4"
            itemClass="px-3"
            showDots
            dotListClass="carousel-dot-list"
            removeArrowOnDeviceType={["mobile"]}
          >
            {EVENTS_DATA.map(event => (
              <EventCarouselCard
                key={event.id}
                event={event}
                onClick={() => setSelectedEvent(event)}
              />
            ))}
          </Carousel>
        </div>
      </section>

      {/* ===== EVENT DETAIL POPUP MODAL ===== */}
      <AnimatePresence>
        {selectedEvent && (
          <EventDetailModal event={selectedEvent} onClose={() => setSelectedEvent(null)} />
        )}
      </AnimatePresence>

      {/* ===== GALLERY HIGHLIGHTS ===== */}
      <section className="gallery-container py-5 text-center">
        <div className="container">
          <h2 className="section-title-main mb-5">Gallery Highlights</h2>
          <div className="row justify-content-center g-4">
            {GALLERY_ITEMS.map(item => (
              <div key={item.id} className="col-6 col-md-3">
                <motion.div
                  className="gallery-circle-box shadow-sm"
                  style={{ backgroundColor: item.color }}
                  whileHover={{ scale: 1.08 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  {item.title}
                </motion.div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== SUCCESS STORIES ===== */}
      <section className="testimonials-container py-5 bg-light">
        <div className="container text-center">
          <h2 className="section-title-main mb-5">Success Stories</h2>
          <div className="testimonial-profile-card shadow bg-white p-5 mx-auto">
            <div className="profile-avatar-floating">B</div>
            <h5 className="fw-bold mt-4">Bharath J</h5>
            <p className="extra-small text-muted mb-2">Software Engineer – Amazon, 2022 Batch</p>
            <div className="rating-star-box text-warning my-2">
              <i className="fas fa-star mx-1"></i><i className="fas fa-star mx-1"></i>
              <i className="fas fa-star mx-1"></i><i className="fas fa-star mx-1"></i>
              <i className="fas fa-star mx-1"></i>
            </div>
            <p className="testimonial-quote text-muted fst-italic mt-3">
              "The MAMCET Alumni Connect platform has been instrumental in reconnecting me with old friends and expanding my professional network. It's a fantastic resource for staying engaged with the college community."
            </p>
          </div>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
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

// ---- SUB-COMPONENTS ----

const BenefitFeature = ({ icon, title, desc }) => (
  <div className="col-md-3 col-sm-6">
    <motion.div
      className="benefit-item-card h-100 p-4 border-0 shadow-sm bg-white rounded-3"
      whileHover={{ y: -10, boxShadow: '0 20px 40px rgba(200,64,34,0.12)' }}
      transition={{ type: 'spring', stiffness: 280 }}
    >
      <i className={`fas ${icon} fa-3x brand-primary-color mb-3`}></i>
      <h6 className="fw-bold">{title}</h6>
      <p className="small text-muted mb-0">{desc}</p>
    </motion.div>
  </div>
);

const EventCarouselCard = ({ event, onClick }) => (
  <motion.div
    className="event-carousel-card bg-white rounded-4 overflow-hidden shadow-sm"
    style={{ cursor: 'pointer' }}
    onClick={onClick}
    whileHover={{ y: -8, boxShadow: '0 20px 40px rgba(0,0,0,0.14)' }}
    transition={{ type: 'spring', stiffness: 250 }}
  >
    <div className="event-color-header rounded-top-4" style={{ backgroundColor: event.bgColor, height: '160px' }}>
      <span className="event-carousel-tag px-3 py-1 rounded-pill extra-small fw-bold text-dark" style={{ backgroundColor: 'rgba(255,255,255,0.7)' }}>
        {event.tag}
      </span>
    </div>
    <div className="p-4">
      <h5 className="fw-bold text-dark mb-2" style={{ fontSize: '1.05rem' }}>{event.title}</h5>
      <div className="extra-small text-muted fw-semibold mb-1">
        <i className="fas fa-calendar-alt me-2" style={{ color: '#c84022' }}></i>{event.date}
      </div>
      <div className="extra-small text-muted fw-semibold mb-3">
        <i className="fas fa-map-marker-alt me-2" style={{ color: '#c84022' }}></i>{event.venue}
      </div>
      <p className="small text-muted mb-0" style={{ lineHeight: 1.5 }}>{event.desc.substring(0, 90)}...</p>
      <div className="d-flex align-items-center mt-3 gap-2">
        <span className="extra-small fw-bold" style={{ color: '#c84022' }}>View Details</span>
        <i className="fas fa-arrow-right extra-small" style={{ color: '#c84022' }}></i>
      </div>
    </div>
  </motion.div>
);

const EventDetailModal = ({ event, onClose }) => (
  <motion.div
    className="event-modal-overlay"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    onClick={onClose}
  >
    <motion.div
      className="event-modal-card bg-white rounded-4 shadow-lg overflow-hidden"
      initial={{ scale: 0.85, opacity: 0, y: 40 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      exit={{ scale: 0.85, opacity: 0, y: 40 }}
      transition={{ type: 'spring', stiffness: 250, damping: 24 }}
      onClick={e => e.stopPropagation()}
    >
      {/* Color Banner */}
      <div className="event-modal-banner rounded-top-4 position-relative" style={{ backgroundColor: event.bgColor, height: '170px' }}>
        <button
          onClick={onClose}
          className="position-absolute top-0 end-0 m-3 border-0 rounded-circle d-flex align-items-center justify-content-center"
          style={{ width: '34px', height: '34px', backgroundColor: 'rgba(0,0,0,0.25)', color: '#fff', cursor: 'pointer' }}
        >
          <i className="fas fa-times"></i>
        </button>
        <span className="px-3 py-1 rounded-pill extra-small fw-bold text-dark position-absolute bottom-0 start-0 m-3" style={{ backgroundColor: 'rgba(255,255,255,0.75)' }}>
          {event.tag}
        </span>
      </div>

      {/* Content */}
      <div className="p-4 p-md-5">
        <h3 className="fw-bold text-dark mb-3">{event.title}</h3>
        <div className="d-flex flex-wrap gap-3 mb-4">
          <span className="extra-small fw-bold text-muted"><i className="fas fa-calendar-alt me-2" style={{ color: '#c84022' }}></i>{event.date}</span>
          <span className="extra-small fw-bold text-muted"><i className="fas fa-clock me-2" style={{ color: '#c84022' }}></i>{event.time}</span>
        </div>
        <p className="text-muted mb-4" style={{ lineHeight: 1.8 }}>{event.desc}</p>
        <div className="p-3 rounded-3 d-flex align-items-center gap-3 mb-5" style={{ backgroundColor: '#f9f9f9' }}>
          <i className="fas fa-map-marker-alt fs-4" style={{ color: '#c84022' }}></i>
          <div>
            <div className="extra-small fw-bold text-uppercase text-muted">Venue</div>
            <div className="fw-semibold text-dark">{event.venue}</div>
          </div>
        </div>
        <motion.button
          className="btn text-white w-100 rounded-pill py-3 fw-bold"
          style={{ backgroundColor: '#c84022', fontSize: '1rem' }}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
        >
          <i className="fas fa-check-circle me-2"></i>RSVP / Register
        </motion.button>
      </div>
    </motion.div>
  </motion.div>
);

export default HomeScreen;