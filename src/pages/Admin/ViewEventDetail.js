import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import AdminNavbar from '../../components/admin/AdminNavbar';

const ViewEventDetail = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const event = state?.event;

  if (!event) return <div className="text-center mt-5">No Event Data Found!</div>;

  return (
    <div style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
      <AdminNavbar />
      <div className="container py-5">
        <button className="btn btn-dark btn-sm mb-4 fw-bold" onClick={() => navigate(-1)}>BACK</button>
        
        <div className="card border-0 shadow-sm mx-auto" style={{ maxWidth: '800px', borderRadius: '15px' }}>
          <img src="https://via.placeholder.com/800x400" className="card-img-top" alt="event" style={{ borderRadius: '15px 15px 0 0', height: '300px', objectFit: 'cover' }} />
          <div className="card-body p-4">
            <h3 className="fw-bold text-danger mb-3">{event.title}</h3>
            <div className="row mb-4">
              <div className="col-md-6">
                <p className="mb-2"><strong><i className="fas fa-calendar-alt me-2"></i>Date:</strong> {event.date}</p>
                <p className="mb-2"><strong><i className="fas fa-clock me-2"></i>Time:</strong> {event.time || 'TBA'}</p>
              </div>
              <div className="col-md-6">
                <p className="mb-2"><strong><i className="fas fa-tag me-2"></i>Type:</strong> {event.type}</p>
                <p className="mb-2"><strong><i className="fas fa-map-marker-alt me-2"></i>Location:</strong> {event.location || 'College Campus'}</p>
              </div>
            </div>
            <h5 className="fw-bold border-bottom pb-2">Description</h5>
            <p className="text-muted" style={{ lineHeight: '1.8' }}>{event.description}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewEventDetail;