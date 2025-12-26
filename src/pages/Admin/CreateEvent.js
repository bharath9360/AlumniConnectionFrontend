import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import '../../styles/Auth.css';

/**
 * CreateEvent Component (Admin)
 * Allows admins to post new events like Reunions, Webinars, or Symposiums.
 */
const CreateEvent = () => {
  // Dummy State to store events locally for now
  const [events, setEvents] = useState([]);
  const [eventData, setEventData] = useState({
    title: '',
    category: '',
    date: '',
    time: '',
    venue: '',
    description: '',
    organizer: 'MAMCET Admin'
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    // Adding to dummy list
    setEvents([...events, { ...eventData, id: Date.now() }]);
    alert("Event Created Successfully! (Dummy storage)");
    console.log("Current Events List:", events);
  };

  return (
    <div className="signup-background py-5 min-vh-100">
      <Link to="/alumni/home" className="back-btn-circle" title="Back">
        <i className="fas fa-arrow-left"></i>
      </Link>

      <div className="container d-flex justify-content-center">
        <div className="form-glass-container p-4 p-md-5" style={{ maxWidth: '700px' }}>
          <div className="text-center mb-4">
            <h3 className="fw-bold brand-name-red">Create New Event</h3>
            <p className="text-muted small">Fill in the details to notify the Alumni network</p>
          </div>

          <form onSubmit={handleSubmit} className="row g-3">
            {/* Event Title */}
            <div className="col-12">
              <label className="form-label small fw-bold">Event Title</label>
              <input 
                type="text" 
                className="form-control" 
                placeholder="e.g., Grand Alumni Meet 2026" 
                required 
                onChange={(e) => setEventData({...eventData, title: e.target.value})}
              />
            </div>

            {/* Category */}
            <div className="col-md-6">
              <label className="form-label small fw-bold">Category</label>
              <select 
                className="form-select" 
                required
                onChange={(e) => setEventData({...eventData, category: e.target.value})}
              >
                <option value="">Choose category...</option>
                <option value="Reunion">Reunion</option>
                <option value="Webinar">Webinar</option>
                <option value="Symposium">Symposium</option>
                <option value="Workshop">Workshop</option>
              </select>
            </div>

            {/* Organizer */}
            <div className="col-md-6">
              <label className="form-label small fw-bold">Organizing Department</label>
              <input 
                type="text" 
                className="form-control" 
                placeholder="e.g. CSE Dept" 
                required 
                onChange={(e) => setEventData({...eventData, organizer: e.target.value})}
              />
            </div>

            {/* Date and Time */}
            <div className="col-md-6">
              <label className="form-label small fw-bold">Event Date</label>
              <input 
                type="date" 
                className="form-control" 
                required 
                onChange={(e) => setEventData({...eventData, date: e.target.value})}
              />
            </div>
            <div className="col-md-6">
              <label className="form-label small fw-bold">Event Time</label>
              <input 
                type="time" 
                className="form-control" 
                required 
                onChange={(e) => setEventData({...eventData, time: e.target.value})}
              />
            </div>

            {/* Venue */}
            <div className="col-12">
              <label className="form-label small fw-bold">Venue / Location</label>
              <input 
                type="text" 
                className="form-control" 
                placeholder="e.g. College Auditorium / Zoom Link" 
                required 
                onChange={(e) => setEventData({...eventData, venue: e.target.value})}
              />
            </div>

            {/* Description */}
            <div className="col-12">
              <label className="form-label small fw-bold">Description</label>
              <textarea 
                className="form-control" 
                rows="3" 
                placeholder="Brief about the event..."
                onChange={(e) => setEventData({...eventData, description: e.target.value})}
              ></textarea>
            </div>

            {/* Submit Button */}
            <div className="d-grid mt-4">
              <button type="submit" className="btn btn-mamcet-red btn-lg fw-bold">
                POST EVENT
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateEvent;