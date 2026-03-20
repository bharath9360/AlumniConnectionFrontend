import React from 'react';
import { useNavigate } from 'react-router-dom';

export const NewsWidget = ({ news }) => {
    const navigate = useNavigate();
    return (
        <div className="dashboard-card p-3 shadow-sm bg-white mb-3 rounded-3 border-0">
            <h6 className="fw-bold mb-3 small">COLLEGE NEWS</h6>
            {news.map((item, index) => (
                <div key={index} className="news-item-compact mb-3 hover-bg-light p-1 rounded" style={{ cursor: 'pointer' }} onClick={() => navigate('/events')}>
                    <p className="mb-0 small fw-bold">{item.title}</p>
                    <span className="extra-small text-muted">{item.date}</span>
                </div>
            ))}
            <button className="btn btn-sm btn-outline-secondary w-100 fw-bold rounded-pill" onClick={() => navigate('/events')}>More News</button>
        </div>
    );
};

export const EventsWidget = ({ events }) => {
    const navigate = useNavigate();
    return (
        <div className="dashboard-card p-3 shadow-sm bg-white rounded-3 border-0">
            <h6 className="fw-bold mb-3 small">UPCOMING EVENTS</h6>
            {events.map((event, index) => (
                <div
                    key={index}
                    className={`event-item-sidebar mb-2 p-2 rounded bg-light hover-bg-light ${index === 0 ? 'border-start border-danger border-4' : ''}`}
                    style={{ cursor: 'pointer' }}
                    onClick={() => navigate('/events')}
                >
                    <p className="mb-0 extra-small fw-bold">{event.title}</p>
                </div>
            ))}
        </div>
    );
};
