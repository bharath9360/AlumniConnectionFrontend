import React, { useState, useEffect } from 'react';
import { eventService } from '../../services/api';
import Modal from '../../components/common/Modal';
import Toast from '../../components/common/Toast';
import { ClipLoader } from 'react-spinners';

const Events = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const [newEvent, setNewEvent] = useState({
    title: '', category: 'Networking', date: '', time: '', venue: '', desc: '', image: ''
  });

  const showToast = (message, type = 'success') => setToast({ message, type });

  useEffect(() => {
    const load = async () => {
      try {
        const res = await eventService.getEvents();
        setEvents(res.data.data || []);
      } catch (err) {
        showToast('Failed to load events. Please refresh.', 'error');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleRegister = async (eventId) => {
    setActionLoading(true);
    try {
      const res = await eventService.toggleRegister(eventId);
      const updated = res.data.data;
      setEvents(prev => prev.map(e => (e._id === eventId || e.id === eventId) ? { ...e, registered: updated.registered } : e));
      setIsRegisterModalOpen(false);
      setIsDetailModalOpen(false);
      showToast(updated.registered ? 'Registration successful!' : 'Registration cancelled.');
    } catch (err) {
      showToast('Action failed. Please try again.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateEvent = async () => {
    if (!newEvent.title || !newEvent.date) {
      showToast('Please fill in the title and date.', 'error');
      return;
    }
    setActionLoading(true);
    try {
      const res = await eventService.createEvent(newEvent);
      setEvents(prev => [res.data.data, ...prev]);
      setIsCreateModalOpen(false);
      showToast('Event created successfully!', 'success');
      setNewEvent({ title: '', category: 'Networking', date: '', time: '', venue: '', desc: '', image: '' });
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to create event.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="dashboard-main-bg min-vh-100 d-flex align-items-center justify-content-center">
        <ClipLoader color="#c84022" size={45} />
      </div>
    );
  }

  return (
    <div className="dashboard-main-bg py-5 min-vh-100">
      <div className="container">
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-5 gap-3">
          <h2 className="fw-bold mb-0 text-dark">Alumni Events &amp; Networking</h2>
          <button className="btn btn-mamcet-red px-4 fw-bold rounded-pill" onClick={() => setIsCreateModalOpen(true)}>
            <i className="fas fa-plus me-2"></i>Create Event
          </button>
        </div>

        <div className="row g-4 justify-content-center">
          {events.length === 0 ? (
            <div className="text-center p-5 bg-white rounded-3 shadow-sm">
              <p className="text-muted">No events yet. Create the first one!</p>
            </div>
          ) : events.map(event => (
            <div key={event._id || event.id} className="col-md-4">
              <div className="dashboard-card bg-white shadow-sm border-0 rounded-3 overflow-hidden h-100 d-flex flex-column">
                <div className="event-img-wrapper" style={{ height: '180px' }}>
                  <img src={event.image || 'https://via.placeholder.com/600x300'} alt={event.title} className="w-100 h-100 object-fit-cover" />
                </div>
                <div className="p-4 flex-grow-1 d-flex flex-column">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="badge bg-light text-mamcet-red border border-danger-subtle px-3 py-2 rounded-pill extra-small fw-bold">{event.category}</span>
                    <span className="extra-small text-muted fw-bold"><i className="fas fa-calendar-alt me-1 text-mamcet-red"></i> {event.date}</span>
                  </div>
                  <h5 className="fw-bold text-dark mb-2">{event.title}</h5>
                  <p className="small text-muted flex-grow-1">{event.desc?.substring(0, 100)}...</p>
                  <div className="divider-line my-3"></div>
                  <div className="extra-small fw-bold text-muted mb-4">
                    <div className="mb-2"><i className="fas fa-map-marker-alt me-2 text-mamcet-red"></i> {event.venue}</div>
                    <div><i className="fas fa-clock me-2 text-mamcet-red"></i> {event.time}</div>
                  </div>
                  <div className="d-flex gap-2 mt-auto">
                    <button className="btn btn-pro btn-pro-outline btn-pro-sm px-3" onClick={() => { setSelectedEvent(event); setIsDetailModalOpen(true); }}>View Details</button>
                    <button className={`btn btn-pro ${event.registered ? 'btn-success' : 'btn-pro-primary'} btn-pro-sm px-3`} onClick={() => { setSelectedEvent(event); setIsRegisterModalOpen(true); }}>
                      {event.registered ? 'Registered' : 'Register Now'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Detail Modal */}
      <Modal isOpen={isDetailModalOpen} onClose={() => setIsDetailModalOpen(false)} title="Event Details">
        {selectedEvent && (
          <div>
            <img src={selectedEvent.image} alt={selectedEvent.title} className="w-100 rounded-3 mb-4 shadow-sm" />
            <h4 className="fw-bold text-dark mb-2">{selectedEvent.title}</h4>
            <div className="d-flex gap-3 mb-4 extra-small fw-bold text-muted">
              <span><i className="fas fa-tag me-1 text-mamcet-red"></i> {selectedEvent.category}</span>
              <span><i className="fas fa-calendar me-1 text-mamcet-red"></i> {selectedEvent.date}</span>
              <span><i className="fas fa-clock me-1 text-mamcet-red"></i> {selectedEvent.time}</span>
            </div>
            <p className="text-muted mb-4">{selectedEvent.desc}</p>
            <div className="p-3 bg-light rounded-3 d-flex align-items-center gap-2">
              <i className="fas fa-map-marker-alt text-mamcet-red fs-4"></i>
              <div><h6 className="fw-bold mb-0 extra-small">Venue</h6><p className="mb-0 extra-small text-muted">{selectedEvent.venue}</p></div>
            </div>
          </div>
        )}
      </Modal>

      {/* Register Modal */}
      <Modal isOpen={isRegisterModalOpen} onClose={() => setIsRegisterModalOpen(false)}
        title={selectedEvent?.registered ? 'Cancel Registration' : 'Event Registration'}
        footer={
          <button className={`btn ${selectedEvent?.registered ? 'btn-outline-danger' : 'btn-mamcet-red'} px-4 rounded-pill fw-bold d-flex gap-2 align-items-center`}
            onClick={() => handleRegister(selectedEvent._id || selectedEvent.id)} disabled={actionLoading}>
            {actionLoading ? <ClipLoader size={14} color="#fff" /> : null}
            {selectedEvent?.registered ? 'Confirm Cancellation' : 'Confirm Registration'}
          </button>
        }>
        <p className="text-muted">
          {selectedEvent?.registered ? 'Are you sure you want to cancel your registration?' : 'By confirming, you will be registered for the event.'}
        </p>
        <div className="p-3 bg-light rounded-3 mb-2">
          <h6 className="fw-bold mb-1 small">{selectedEvent?.title}</h6>
          <p className="extra-small text-muted mb-0">{selectedEvent?.date} | {selectedEvent?.time}</p>
        </div>
      </Modal>

      {/* Create Event Modal */}
      <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Create New Event"
        footer={
          <button className="btn btn-mamcet-red px-4 rounded-pill fw-bold d-flex gap-2 align-items-center" onClick={handleCreateEvent} disabled={actionLoading}>
            {actionLoading ? <ClipLoader size={14} color="#fff" /> : null} Process &amp; Post
          </button>
        }>
        <div className="row g-3">
          <div className="col-12"><label className="form-label extra-small fw-bold">Event Title</label><input type="text" className="form-control" value={newEvent.title} onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })} /></div>
          <div className="col-md-6"><label className="form-label extra-small fw-bold">Category</label>
            <select className="form-select" value={newEvent.category} onChange={(e) => setNewEvent({ ...newEvent, category: e.target.value })}>
              <option>Networking</option><option>Webinar</option><option>Reunion</option><option>Workshop</option>
            </select>
          </div>
          <div className="col-md-6"><label className="form-label extra-small fw-bold">Image URL</label><input type="text" className="form-control" placeholder="https://..." value={newEvent.image} onChange={(e) => setNewEvent({ ...newEvent, image: e.target.value })} /></div>
          <div className="col-md-6"><label className="form-label extra-small fw-bold">Date</label><input type="date" className="form-control" value={newEvent.date} onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })} /></div>
          <div className="col-md-6"><label className="form-label extra-small fw-bold">Time</label><input type="time" className="form-control" value={newEvent.time} onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })} /></div>
          <div className="col-12"><label className="form-label extra-small fw-bold">Venue</label><input type="text" className="form-control" value={newEvent.venue} onChange={(e) => setNewEvent({ ...newEvent, venue: e.target.value })} /></div>
          <div className="col-12"><label className="form-label extra-small fw-bold">Description</label><textarea className="form-control" rows="3" value={newEvent.desc} onChange={(e) => setNewEvent({ ...newEvent, desc: e.target.value })}></textarea></div>
        </div>
      </Modal>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};

export default Events;
