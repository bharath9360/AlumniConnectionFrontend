import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import AdminNavbar from '../../components/admin/AdminNavbar';

/** * CONFIGURATION: Centralized labels, icons, and fallback values
 */
const CONFIG = {
  LABELS: {
    BACK_BTN: "BACK",
    DATE: "Date:",
    TIME: "Time:",
    TYPE: "Type:",
    LOCATION: "Location:",
    DESC_TITLE: "Description",
    ERROR_MSG: "No Event Data Found!",
    TBA: "TBA",
    DEFAULT_LOC: "College Campus"
  },
  ICONS: {
    DATE: "fas fa-calendar-alt",
    TIME: "fas fa-clock",
    TYPE: "fas fa-tag",
    LOCATION: "fas fa-map-marker-alt"
  },
  PLACEHOLDER_IMG: "https://via.placeholder.com/800x400"
};

/** * COMPONENT: EventHero
 * Renders the top image of the event
 */
const EventHero = ({ src }) => (
  <img 
    src={src || CONFIG.PLACEHOLDER_IMG} 
    className="card-img-top" 
    alt="event" 
    style={{ borderRadius: '15px 15px 0 0', height: '300px', objectFit: 'cover' }} 
  />
);

/** * COMPONENT: MetaItem
 * Renders a single icon-label-value pair
 */
const MetaItem = ({ icon, label, value }) => (
  <p className="mb-2">
    <strong><i className={`${icon} me-2`}></i>{label}</strong> {value}
  </p>
);

/** * COMPONENT: EventMetadata
 * Renders the grid of event details (Date, Time, Type, Location)
 */
const EventMetadata = ({ event }) => (
  <div className="row mb-4">
    <div className="col-md-6 text-start">
      <MetaItem icon={CONFIG.ICONS.DATE} label={CONFIG.LABELS.DATE} value={event.date} />
      <MetaItem icon={CONFIG.ICONS.TIME} label={CONFIG.LABELS.TIME} value={event.time || CONFIG.LABELS.TBA} />
    </div>
    <div className="col-md-6 text-start">
      <MetaItem icon={CONFIG.ICONS.TYPE} label={CONFIG.LABELS.TYPE} value={event.type} />
      <MetaItem icon={CONFIG.ICONS.LOCATION} label={CONFIG.LABELS.LOCATION} value={event.location || CONFIG.LABELS.DEFAULT_LOC} />
    </div>
  </div>
);

/** * COMPONENT: EventDescription
 * Renders the description section
 */
const EventDescription = ({ title, text }) => (
  <>
    <h5 className="fw-bold border-bottom pb-2 text-start">{title}</h5>
    <p className="text-muted text-start" style={{ lineHeight: '1.8' }}>{text}</p>
  </>
);

/** * MAIN COMPONENT: ViewEventDetail
 */
const ViewEventDetail = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const event = state?.event;

  // Handle missing data scenario
  if (!event) {
    return <div className="text-center mt-5"><h4>{CONFIG.LABELS.ERROR_MSG}</h4></div>;
  }

  return (
    <div style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
      <AdminNavbar />
      
      <div className="container py-5">
        {/* Navigation Button */}
        <div className="text-start">
            <button className="btn btn-dark btn-sm mb-4 fw-bold px-4" onClick={() => navigate(-1)}>
            {CONFIG.LABELS.BACK_BTN}
            </button>
        </div>

        <div className="card border-0 shadow-sm mx-auto" style={{ maxWidth: '800px', borderRadius: '15px' }}>
          
          <EventHero src={event.image} />

          <div className="card-body p-4">
            {/* Dynamic Title */}
            <h3 className="fw-bold text-danger mb-3 text-start">{event.title}</h3>
            
            {/* Meta Info Grid */}
            <EventMetadata event={event} />

            {/* Content Section */}
            <EventDescription 
                title={CONFIG.LABELS.DESC_TITLE} 
                text={event.description} 
            />
          </div>

        </div>
      </div>
    </div>
  );
};

export default ViewEventDetail;