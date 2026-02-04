import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminNavbar from '../../components/admin/AdminNavbar';

const UpcomingEventsList = () => {
  const navigate = useNavigate();
  const [allEvents, setAllEvents] = useState([]);

  useEffect(() => {
    // Local Storage-ல் இருந்து டேட்டாவை எடுக்கிறோம்
    const savedEvents = JSON.parse(localStorage.getItem('adminEvents')) || [];
    
    // ஆரம்பத்தில் காட்ட வேண்டிய டம்மி டேட்டா
    const dummyEvents = [
      { id: 101, title: 'Pongal Celebration', type: 'Cultural event', description: 'Join us for a vibrant Pongal celebration.', date: '2026-01-14' },
    ];
    
    setAllEvents([...savedEvents, ...dummyEvents]);
  }, []);

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
            <div key={ev.id} className="d-flex justify-content-between align-items-center border-bottom py-4 last-child-no-border">
              <div style={{ width: '80%' }}>
                <h6 className="fw-bold mb-1" style={{ color: '#b22222' }}>
                  {ev.title} <span className="text-danger fw-normal small ms-2">( {ev.type || ev.date} )</span>
                </h6>
                <p className="text-muted small mb-2">{ev.description}</p>
                <button className="btn btn-outline-dark btn-sm rounded shadow-sm px-3" style={{ fontSize: '11px' }}>View Detail's</button>
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