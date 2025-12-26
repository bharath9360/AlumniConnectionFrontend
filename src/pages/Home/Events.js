import React from 'react';
import '../../styles/Dashboard.css';

const Events = () => {
  // Dummy List for Display
  const EVENTS_LIST = [
    {
      id: 1,
      title: "Grand Alumni Meet '26",
      date: "Jan 26, 2026",
      time: "10:00 AM",
      venue: "MAMCET Main Auditorium",
      category: "Reunion",
      desc: "Join us for a nostalgic walk down memory lane with your batchmates."
    },
    {
      id: 2,
      title: "Industry 4.0 Webinar",
      date: "Feb 05, 2026",
      time: "02:30 PM",
      venue: "Online (Google Meet)",
      category: "Webinar",
      desc: "An expert talk on latest industrial trends by our alumni."
    }
  ];

  return (
    <div className="dashboard-main-bg py-5 min-vh-100">
      <div className="container">
        <h3 className="fw-bold mb-4 text-center">College Events & Meets</h3>
        <div className="row g-4 justify-content-center">
          {EVENTS_LIST.map(event => (
            <div key={event.id} className="col-md-5">
              <div className="dashboard-card bg-white shadow-sm overflow-hidden">
                <div className="p-3 text-white fw-bold text-center" style={{ backgroundColor: '#c84022' }}>
                  {event.category}
                </div>
                <div className="p-4">
                  <h5 className="fw-bold brand-red-text mb-2">{event.title}</h5>
                  <p className="small text-muted mb-3">{event.desc}</p>
                  <div className="divider-line mb-3"></div>
                  <div className="extra-small fw-bold">
                    <p className="mb-1"><i className="fas fa-calendar-day me-2 text-danger"></i> {event.date} | {event.time}</p>
                    <p className="mb-0"><i className="fas fa-map-marker-alt me-2 text-danger"></i> {event.venue}</p>
                  </div>
                  <button className="btn btn-dark btn-sm w-100 mt-4 fw-bold">RSVP / Register</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Events;