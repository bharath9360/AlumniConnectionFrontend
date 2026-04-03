import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Carousel from 'react-multi-carousel';
import 'react-multi-carousel/lib/styles.css';
import StatCard from '../../components/cards/StatCard';
import { landingService } from '../../services/api';
import '../../styles/Home.css';

// --- STATIC FALLBACKS (used only if CMS API is unreachable) ---
const FALLBACK_GALLERY = [
  { title: "Festa'25", color: "#ffc8dd" },
  { title: "Fest'24", color: "#cdb4db" },
  { title: "IEEE Event", color: "#bde0fe" },
  { title: "Symposium", color: "#a2d2ff" }
];

const FALLBACK_EVENTS = [
  { tag: "Annual Meet", title: "Alumni Network Night", bgColor: "#a2d2ff", date: "April 15, 2026", venue: "MAMCET Main Auditorium, Trichy", time: "6:00 PM – 9:00 PM", desc: "Reconnect with your batch mates and expand your professional circle at this exclusive Alumni Networking Night." },
  { tag: "Annual Event", title: "Annual Alumni Meet 2026", bgColor: "#bde0fe", date: "May 20, 2026", venue: "MAMCET Sports Complex, Trichy", time: "10:00 AM – 5:00 PM", desc: "The biggest gathering of the year! Join us for a day of celebrations, cultural programs, sports activities, and memories." },
  { tag: "Career Fair", title: "Campus Career Fair", bgColor: "#ffafcc", date: "June 5, 2026", venue: "MAMCET Seminar Hall", time: "9:00 AM – 4:00 PM", desc: "Top companies recruiting directly from campus. Bring your resume, dress sharp, and walk in with confidence." },
];

const CAROUSEL_RESPONSIVE = {
  desktop: { breakpoint: { max: 3000, min: 1024 }, items: 3, slidesToSlide: 1 },
  tablet: { breakpoint: { max: 1024, min: 640 }, items: 2, slidesToSlide: 1 },
  mobile: { breakpoint: { max: 640, min: 0 }, items: 1, slidesToSlide: 1 }
};

const DEFAULT_BG_IMAGE = 'https://res.cloudinary.com/dnby5o1lt/image/upload/v1754489527/alumni_linked_in_background_image_sgla6a.jpg';

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

// --- CMS HELPER: get field value from a section's fields array ---
const fv = (fields, key, fallback = '') =>
  fields?.find(f => f.key === key)?.value || fallback;

// --- MAIN COMPONENT ---
const HomeScreen = () => {
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [cms, setCms] = useState(null);
  const [cmsLoading, setCmsLoading] = useState(true);

  useEffect(() => {
    const fetchCms = async () => {
      try {
        const res = await landingService.getSections();
        const sections = res.data?.data || [];
        const map = {};
        sections.forEach(s => { map[s.sectionType] = s; });
        setCms(map);
      } catch (err) {
        console.warn('[HomeScreen] CMS fetch failed, using static fallbacks.', err.message);
        setCms(null);
      } finally {
        setCmsLoading(false);
      }
    };
    fetchCms();
  }, []);

  // ─── HERO ──────────────────────────────────────────────
  const hero = cms?.hero;
  const heroTitle    = hero ? fv(hero.fields, 'title',    'Connect With MAMCET') : 'Connect With MAMCET';
  const heroSubtitle = hero ? fv(hero.fields, 'subtitle', 'Join 5,000+ alumni, stay connected, discover opportunities and give back to your alma mater.') : 'Join 5,000+ alumni, stay connected, discover opportunities and give back to your alma mater.';
  const heroCtaText  = hero ? fv(hero.fields, 'ctaText',  'Join Now') : 'Join Now';
  const heroCtaLink  = hero ? fv(hero.fields, 'ctaLink',  '/register') : '/register';
  const heroBgImage  = hero ? fv(hero.fields, 'bgImage',  DEFAULT_BG_IMAGE) : DEFAULT_BG_IMAGE;

  // ─── STATS ─────────────────────────────────────────────
  const stats = cms?.stats;
  const statsHeading = stats ? fv(stats.fields, 'heading', 'ALUMNI PLATFORM VISION') : 'ALUMNI PLATFORM VISION';
  const statsItems   = stats?.items || [
    { fields: [{ key: 'value', value: '5000+' }, { key: 'label', value: 'Members' }] },
    { fields: [{ key: 'value', value: '18+' },   { key: 'label', value: 'Batches' }] },
    { fields: [{ key: 'value', value: '70+' },   { key: 'label', value: 'Companies' }] },
  ];

  // ─── FEATURES ──────────────────────────────────────────
  const features = cms?.features;
  const featuresHeading = features ? fv(features.fields, 'heading', 'Key Benefits') : 'Key Benefits';
  const featuresItems   = features?.items || [
    { fields: [{ key: 'icon', value: 'fa-sync-alt' },     { key: 'title', value: 'Reconnect' },     { key: 'desc', value: 'Reminisce about college days and build lasting relationships with old friends.' }] },
    { fields: [{ key: 'icon', value: 'fa-briefcase' },    { key: 'title', value: 'Opportunities' }, { key: 'desc', value: 'Explore exclusive job postings and advance your career through our network.' }] },
    { fields: [{ key: 'icon', value: 'fa-calendar-alt' }, { key: 'title', value: 'Events & Reunion' }, { key: 'desc', value: 'Participate in college events, reunions, and stay updated with the community.' }] },
    { fields: [{ key: 'icon', value: 'fa-trophy' },       { key: 'title', value: 'Achievements' },  { key: 'desc', value: 'Celebrate alumni success stories and engage with our accomplished graduates.' }] },
  ];

  // ─── TESTIMONIALS ──────────────────────────────────────
  const testimonials = cms?.testimonials;
  const testimonialsItems = testimonials?.items || [
    { fields: [{ key: 'name', value: 'Bharath J' }, { key: 'role', value: 'Software Engineer – Amazon, 2022 Batch' }, { key: 'quote', value: '"The MAMCET Alumni Connect platform has been instrumental in reconnecting me with old friends and expanding my professional network."' }] },
  ];

  // ─── EVENTS (CMS-managed) ──────────────────────────────
  const eventsSection = cms?.events;
  const eventsHeading = eventsSection ? fv(eventsSection.fields, 'heading', 'Upcoming Events') : 'Upcoming Events';
  const eventsSubtext = eventsSection ? fv(eventsSection.fields, 'subtext', 'Click on an event card to see full details and RSVP.') : 'Click on an event card to see full details and RSVP.';
  const eventsItems = eventsSection?.items?.length > 0
    ? eventsSection.items.map((item, idx) => ({
        id: item._itemId || idx,
        tag:     fv(item.fields, 'tag',     ''),
        title:   fv(item.fields, 'title',   ''),
        bgColor: fv(item.fields, 'bgColor', '#a2d2ff'),
        date:    fv(item.fields, 'date',    ''),
        venue:   fv(item.fields, 'venue',   ''),
        time:    fv(item.fields, 'time',    ''),
        desc:    fv(item.fields, 'desc',    ''),
      }))
    : FALLBACK_EVENTS;

  // ─── GALLERY (CMS-managed) ─────────────────────────────
  const gallerySection = cms?.gallery;
  const galleryHeading = gallerySection ? fv(gallerySection.fields, 'heading', 'Gallery Highlights') : 'Gallery Highlights';
  const galleryItems = gallerySection?.items?.length > 0
    ? gallerySection.items.map((item, idx) => ({
        id:    item._itemId || idx,
        title: fv(item.fields, 'title', ''),
        color: fv(item.fields, 'color', '#ffc8dd'),
        image: fv(item.fields, 'image', ''),
      }))
    : FALLBACK_GALLERY;

  // ─── FOOTER ────────────────────────────────────────────
  const footer = cms?.footer;
  const footerEmail     = footer ? fv(footer.fields, 'email',     'alumni@mamcet.com')  : 'alumni@mamcet.com';
  const footerPhone     = footer ? fv(footer.fields, 'phone',     '8088077077')         : '8088077077';
  const footerAddress   = footer ? fv(footer.fields, 'address',   'Chennai Trunk Road, Siruganur, Trichy - 621105') : 'Chennai Trunk Road, Siruganur, Trichy - 621105';
  const footerCopyright = footer ? fv(footer.fields, 'copyright', '© 2025 MAMCET Alumni Connect. All rights reserved.') : '© 2025 MAMCET Alumni Connect. All rights reserved.';
  const footerTagline   = footer ? fv(footer.fields, 'tagline',   '') : '';

  // ─── Dynamic hero background style ─────────────────────
  const heroStyle = heroBgImage ? {
    backgroundImage: `url('${heroBgImage}')`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'center center',
    backgroundSize: 'cover',
    backgroundAttachment: 'fixed',
  } : {};

  return (
    <div className="homepage-wrapper">

      {/* ===== HERO SECTION ===== */}
      {(!cms || cms.hero) && (
        <section className="hero-landing position-relative overflow-hidden" style={heroStyle}>
          <div className="hero-mask" />

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
              {heroTitle}
            </motion.h1>

            <motion.p
              className="hero-sub-text text-white-50 mt-3 mb-5 mx-auto"
              style={{ maxWidth: '560px', fontSize: '1.1rem', lineHeight: 1.7 }}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              {heroSubtitle}
            </motion.p>

            <motion.div
              className="d-flex justify-content-center gap-3 flex-wrap"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              <Link to={heroCtaLink} className="btn btn-lg px-5 py-3 fw-bold rounded-pill text-white" style={{ backgroundColor: '#c84022' }}>
                {heroCtaText}
              </Link>
              <Link to="/login" className="btn btn-lg px-5 py-3 fw-bold rounded-pill btn-outline-light">
                Log In
              </Link>
            </motion.div>

            <motion.div
              className="hero-scroll-indicator mt-5"
              variants={floatVariant}
              animate="animate"
            >
              <i className="fas fa-chevron-down text-white-50" style={{ fontSize: '1.5rem' }}></i>
            </motion.div>
          </div>
        </section>
      )}

      {/* ===== VISION / STATS SECTION ===== */}
      {(!cms || cms.stats) && (
        <section className="vision-highlight-section py-5 text-white">
          <div className="container text-center">
            <h6 className="fw-bold mb-4" style={{ letterSpacing: '2px' }}>{statsHeading}</h6>
            <div className="stats-border-top"></div>
            <div className="row py-4">
              {statsItems.map((item, idx) => (
                <StatCard
                  key={item._itemId || idx}
                  value={fv(item.fields, 'value', '—')}
                  label={fv(item.fields, 'label', '')}
                />
              ))}
            </div>
            <div className="stats-border-bottom"></div>
          </div>
        </section>
      )}

      {/* ===== KEY BENEFITS GRID (Features) ===== */}
      {(!cms || cms.features) && (
        <section id="about" className="benefits-container py-5">
          <div className="container text-center">
            <h2 className="section-title-main">{featuresHeading}</h2>
            <p className="text-muted mb-5">Discover the advantages of joining our Alumni Network.</p>
            <div className="row g-4">
              {featuresItems.map((item, idx) => {
                const icon  = fv(item.fields, 'icon',  '⭐');
                const title = fv(item.fields, 'title', '');
                const desc  = fv(item.fields, 'desc',  '');
                const isFaIcon = icon.startsWith('fa-');
                return (
                  <div className="col-md-3 col-sm-6" key={item._itemId || idx}>
                    <motion.div
                      className="benefit-item-card h-100 p-4 border-0 shadow-sm bg-white rounded-3"
                      whileHover={{ y: -10, boxShadow: '0 20px 40px rgba(200,64,34,0.12)' }}
                      transition={{ type: 'spring', stiffness: 280 }}
                    >
                      {isFaIcon
                        ? <i className={`fas ${icon} fa-3x brand-primary-color mb-3`}></i>
                        : <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>{icon}</div>
                      }
                      <h6 className="fw-bold">{title}</h6>
                      <p className="small text-muted mb-0">{desc}</p>
                    </motion.div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ===== EVENTS CAROUSEL (CMS-managed) ===== */}
      {(!cms || cms.events) && eventsItems.length > 0 && (
        <section className="events-container py-5 bg-light">
          <div className="container-fluid px-4">
            <div className="text-center mb-5">
              <h2 className="section-title-main">{eventsHeading}</h2>
              <p className="text-muted">{eventsSubtext}</p>
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
              {eventsItems.map(event => (
                <EventCarouselCard
                  key={event.id}
                  event={event}
                  onClick={() => setSelectedEvent(event)}
                />
              ))}
            </Carousel>
          </div>
        </section>
      )}

      {/* ===== EVENT DETAIL POPUP MODAL ===== */}
      <AnimatePresence>
        {selectedEvent && (
          <EventDetailModal event={selectedEvent} onClose={() => setSelectedEvent(null)} />
        )}
      </AnimatePresence>

      {/* ===== GALLERY HIGHLIGHTS (CMS-managed) ===== */}
      {(!cms || cms.gallery) && galleryItems.length > 0 && (
        <section className="gallery-container py-5 text-center">
          <div className="container">
            <h2 className="section-title-main mb-5">{galleryHeading}</h2>
            <div className="row justify-content-center g-4">
              {galleryItems.map((item, idx) => (
                <div key={item.id || idx} className="col-6 col-md-3">
                  <motion.div
                    className="gallery-circle-box shadow-sm"
                    style={{
                      backgroundColor: item.color || '#ffc8dd',
                      backgroundImage: item.image ? `url('${item.image}')` : 'none',
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                    }}
                    whileHover={{ scale: 1.08 }}
                    transition={{ type: 'spring', stiffness: 300 }}
                  >
                    {!item.image && item.title}
                  </motion.div>
                  {item.image && <p className="small fw-semibold mt-2 text-muted">{item.title}</p>}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ===== SUCCESS STORIES (Testimonials) ===== */}
      {(!cms || cms.testimonials) && (
        <section className="testimonials-container py-5 bg-light">
          <div className="container text-center">
            <h2 className="section-title-main mb-5">
              {testimonials ? fv(testimonials.fields, 'heading', 'Success Stories') : 'Success Stories'}
            </h2>
            {testimonialsItems.length > 0 && (() => {
              const t = testimonialsItems[0];
              const name  = fv(t.fields, 'name',  'Alumni');
              const role  = fv(t.fields, 'role',  '');
              const quote = fv(t.fields, 'quote', '');
              return (
                <div className="testimonial-profile-card shadow bg-white p-5 mx-auto">
                  <div className="profile-avatar-floating">{name.charAt(0).toUpperCase()}</div>
                  <h5 className="fw-bold mt-4">{name}</h5>
                  <p className="extra-small text-muted mb-2">{role}</p>
                  <div className="rating-star-box text-warning my-2">
                    <i className="fas fa-star mx-1"></i><i className="fas fa-star mx-1"></i>
                    <i className="fas fa-star mx-1"></i><i className="fas fa-star mx-1"></i>
                    <i className="fas fa-star mx-1"></i>
                  </div>
                  <p className="testimonial-quote text-muted fst-italic mt-3">
                    {quote.startsWith('"') ? quote : `"${quote}"`}
                  </p>
                </div>
              );
            })()}
          </div>
        </section>
      )}

      {/* ===== FOOTER ===== */}
      {(!cms || cms.footer) && (
        <footer className="footer-site-main bg-dark text-white py-5" id="contact">
          <div className="container text-center">
            {footerTagline && <p className="mb-3 fw-bold">{footerTagline}</p>}
            <p className="mb-2">For direct inquiries, contact us at <a href={`mailto:${footerEmail}`} className="brand-red-link">{footerEmail}</a></p>
            <p className="mb-2">Phone: <span className="fw-bold">{footerPhone}</span></p>
            {footerAddress && <p className="mb-4">Address: <span className="fw-bold">{footerAddress}</span></p>}
            <p className="text-white-50 extra-small mt-4">{footerCopyright}</p>
          </div>
        </footer>
      )}
    </div>
  );
};

// ---- SUB-COMPONENTS ----

const EventCarouselCard = ({ event, onClick }) => (
  <motion.div
    className="event-carousel-card bg-white rounded-4 overflow-hidden shadow-sm"
    style={{ cursor: 'pointer' }}
    onClick={onClick}
    whileHover={{ y: -8, boxShadow: '0 20px 40px rgba(0,0,0,0.14)' }}
    transition={{ type: 'spring', stiffness: 250 }}
  >
    <div className="event-color-header rounded-top-4" style={{ backgroundColor: event.bgColor || '#a2d2ff', height: '160px' }}>
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
      <p className="small text-muted mb-0" style={{ lineHeight: 1.5 }}>{(event.desc || '').substring(0, 90)}...</p>
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
      <div className="event-modal-banner rounded-top-4 position-relative" style={{ backgroundColor: event.bgColor || '#a2d2ff', height: '170px' }}>
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