import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminNavbar from '../../components/admin/AdminNavbar';

/** * CONFIGURATION: Centralized constants to eliminate hardcoding 
 */
const CONFIG = {
  LABELS: {
    PAGE_TITLE: "BASED ON COLLEGE EVENT'S",
    SECTION_TITLE: "UPCOMING EVENT'S",
    CREATE_BTN: "CREATE EVENT",
    VIEW_BTN: "View Detail's"
  },
  DUMMY_DATA: [
    { 
      id: 101, 
      title: 'Pongal Celebration', 
      type: 'Cultural event', 
      description: 'Join us for a vibrant Pongal celebration with traditional events and food.', 
      date: '2026-01-14', 
      location: 'College Grounds', 
      time: '10:00 AM' 
    }
  ],
  STORAGE_KEY: 'adminEvents',
  PATHS: {
    VIEW_EVENT: '/admin/view-event',
    CREATE_EVENT: '/admin/create-event'
  },
  PLACEHOLDER_IMG: "https://via.placeholder.com/80"
};

/** * COMPONENT: EventItem 
 * Renders an individual event row
 */
const EventItem = ({ event, onDetailClick, labels, placeholderImg }) => (
  <div className="d-flex justify-content-between align-items-center border-bottom py-4">
    <div style={{ width: '80%' }} className="text-start">
      <h6 className="fw-bold mb-1" style={{ color: '#b22222' }}>
        {event.title} 
        <span className="text-danger fw-normal small ms-2">
          ( {event.type || event.date} )
        </span>
      </h6>
      <p className="text-muted small mb-2">{event.description}</p>
      <button 
        className="btn btn-outline-dark btn-sm rounded shadow-sm px-3 fw-bold" 
        style={{ fontSize: '11px' }}
        onClick={() => onDetailClick(event)}
      >
        {labels.VIEW_BTN}
      </button>
    </div>
    <img 
      src={event.image || placeholderImg} 
      alt="event-thumbnail" 
      className="rounded border" 
      style={{ width: '80px', height: '80px', objectFit: 'cover' }} 
    />
  </div>
);

/** * COMPONENT: SectionHeader 
 * Renders the title and Create button
 */
const SectionHeader = ({ title, btnLabel, onBtnClick }) => (
  <div className="d-flex justify-content-between align-items-center mb-4 mt-5">
    <h5 className="fw-bold mb-0">{title}</h5>
    <button 
      className="btn btn-danger rounded-pill px-4 fw-bold shadow" 
      onClick={onBtnClick}
    >
      {btnLabel}
    </button>
  </div>
);

/** * MAIN COMPONENT: UpcomingEventsList 
 */
const UpcomingEventsList = () => {
  const navigate = useNavigate();
  const [allEvents, setAllEvents] = useState([]);

  /** * EFFECT: Fetch data from LocalStorage and merge with default dummy data
   */
  useEffect(() => {
    const fetchEvents = () => {
      const savedEvents = JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEY)) || [];
      // Combine newly created events with predefined dummy events
      setAllEvents([...savedEvents, ...CONFIG.DUMMY_DATA]);
    };

    fetchEvents();
  }, []);

  /** * LOGIC: Navigation handlers
   */
  const handleViewDetail = (event) => {
    navigate(CONFIG.PATHS.VIEW_EVENT, { state: { event } });
  };

  const handleCreateNavigate = () => {
    navigate(CONFIG.PATHS.CREATE_EVENT);
  };

  return (
    <div style={{ backgroundColor: '#fff', minHeight: '100vh' }}>
      <AdminNavbar />
      
      <div className="container py-5">
        <h4 className="text-center fw-bold mb-4" style={{ color: '#b22222' }}>
          {CONFIG.LABELS.PAGE_TITLE}
        </h4>
        
        <SectionHeader 
          title={CONFIG.LABELS.SECTION_TITLE} 
          btnLabel={CONFIG.LABELS.CREATE_BTN} 
          onBtnClick={handleCreateNavigate}
        />

        <div className="border rounded p-3 shadow-sm bg-white">
          {allEvents.length > 0 ? (
            allEvents.map((ev) => (
              <EventItem 
                key={ev.id} 
                event={ev} 
                onDetailClick={handleViewDetail}
                labels={CONFIG.LABELS}
                placeholderImg={CONFIG.PLACEHOLDER_IMG}
              />
            ))
          ) : (
            <div className="text-center py-5 text-muted">No events found.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UpcomingEventsList;