import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminNavbar from '../../components/admin/AdminNavbar';

const UpcomingEventsList = () => {
  const navigate = useNavigate();
  const [allEvents, setAllEvents] = useState([]);

  useEffect(() => {
    const savedEvents = JSON.parse(localStorage.getItem('adminEvents')) || [];
    const dummyEvents = [
      { id: 101, title: 'Pongal Celebration', type: 'Cultural event', description: 'Join us for a vibrant Pongal celebration with traditional events and food.', date: '2026-01-14', location: 'College Grounds', time: '10:00 AM' },
    ];
    setAllEvents([...savedEvents, ...dummyEvents]);
  }, []);

  // View Detail பட்டனுக்கான ஃபங்ஷன்
  const handleViewDetail = (event) => {
    navigate('/admin/view-event', { state: { event } });
  };

  return (
    <div style={{ backgroundColor: '#fff', minHeight: '100vh' }}>
      <AdminNavbar />
      <div className="container py-5">
        <h4 className="text-center fw-bold mb-4" style={{ color: '#b22222' }}>BASED ON COLLEGE EVENT'S</h4>
        
        <div className="d-flex justify-content-between align-items-center mb-4 mt-5">
          <h5 className="fw-bold mb-0">UPCOMING EVENT'S</h5>
          <button className="btn btn-danger rounded-pill px-4 fw-bold shadow" onClick={() => navigate('/admin/create-event')}>CREATE EVENT</button>
        </div>

        <div className="border rounded p-3 shadow-sm bg-white">
          {allEvents.map((ev) => (
            <div key={ev.id} className="d-flex justify-content-between align-items-center border-bottom py-4">
              <div style={{ width: '80%' }}>
                <h6 className="fw-bold mb-1" style={{ color: '#b22222' }}>
                  {ev.title} <span className="text-danger fw-normal small ms-2">( {ev.type || ev.date} )</span>
                </h6>
                <p className="text-muted small mb-2">{ev.description}</p>
                {/* இங்கே onClick சேர்த்துள்ளேன் 👇 */}
                <button 
                  className="btn btn-outline-dark btn-sm rounded shadow-sm px-3" 
                  style={{ fontSize: '11px' }}
                  onClick={() => handleViewDetail(ev)}
                >
                  View Detail's
                </button>
              </div>
              <img src="https://via.placeholder.com/80" alt="event" className="rounded border" style={{ width: '80px', height: '80px' }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default UpcomingEventsList;