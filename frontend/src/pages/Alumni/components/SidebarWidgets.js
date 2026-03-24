import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminService } from '../../../services/api';
import { ClipLoader } from 'react-spinners';

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
        <div className="dashboard-card p-3 shadow-sm bg-white rounded-3 border-0 mb-3">
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

export const AdminStatsWidget = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState(null);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await adminService.getStats();
                if (res.data?.data) setStats(res.data.data);
            } catch (err) {
                console.error("Failed to load admin widget stats.");
            }
        };
        fetchStats();
    }, []);

    if (!stats) {
        return (
            <div className="dashboard-card p-3 shadow-sm bg-white rounded-3 border-0 mb-3 text-center">
                <ClipLoader size={20} color="#c84022" />
            </div>
        );
    }

    const totalPending = stats.pendingAlumni + stats.pendingJobs + stats.pendingEvents;

    return (
        <div className="dashboard-card p-3 shadow-sm bg-white rounded-3 border-0 mb-3">
            <h6 className="fw-bold mb-3 small text-danger">ADMIN MODERATION</h6>
            
            <div className="d-flex justify-content-between mb-2 small fw-bold">
                <span className="text-muted">Total Users</span>
                <span>{stats.totalUsers}</span>
            </div>
            
            <div className="d-flex justify-content-between mb-2 small fw-bold">
                <span className="text-muted">Total Posts</span>
                <span>{stats.totalPosts}</span>
            </div>

            <hr className="my-2" />

            <div className="d-flex justify-content-between mb-3 small fw-bold" style={{ color: totalPending > 0 ? '#c84022' : '#28a745' }}>
                <span>Pending Approvals</span>
                <span>{totalPending}</span>
            </div>

            <button 
                className="btn btn-sm text-white w-100 fw-bold rounded-pill" 
                style={{ backgroundColor: '#c84022' }} 
                onClick={() => navigate('/admin/approvals')}
            >
                Review Approvals
            </button>
        </div>
    );
};
