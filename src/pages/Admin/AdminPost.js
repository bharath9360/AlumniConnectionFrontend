import React from 'react';
import { useNavigate } from 'react-router-dom';
import AdminNavbar from '../../components/admin/AdminNavbar';

const AdminPost = () => {
  const navigate = useNavigate();

  // டைனமிக் ரீசென்ட் போஸ்ட்ஸ் டேட்டா
  const recentPosts = [
    { id: 1, title: 'Tech Alumni Mixer', desc: 'Join us for an evening of networking and socializing with fellow alumni.', image: 'https://via.placeholder.com/150' },
    { id: 2, title: 'Annual Homecoming Celebration', desc: 'Celebrate the annual homecoming with campus tour and gala dinner.', image: 'https://via.placeholder.com/150' },
  ];

  return (
    <div style={{ backgroundColor: '#fff', minHeight: '100vh' }}>
      <AdminNavbar />
      <div className="container py-5">
        <h4 className="text-center fw-bold mb-5" style={{ color: '#b22222' }}>POST'S BY CATEGORY</h4>
        
        <div className="row justify-content-center mb-5 gap-4">
          <div className="col-md-3 card p-4 shadow-sm border-0 bg-light text-center" style={{ cursor: 'pointer' }} onClick={() => navigate('/admin/job-vacancies')}>
            <div className="fs-1 mb-2">💼</div>
            <h6 className="fw-bold">JOB VACANCY</h6>
          </div>
          
          {/* UPCOMING EVENTS கார்டு - இந்த வரியை மட்டும் பாருங்க */}
<div 
    className="col-md-3 card p-4 shadow-sm border-0 bg-light text-center" 
    style={{ cursor: 'pointer' }} 
    // இங்க /admin/create-event-க்கு பதிலா /admin/upcoming-events-list-க்கு மாத்தணும்
    onClick={() => navigate('/admin/upcoming-events-list')} 
>
    <div className="fs-1 mb-2">📢</div>
    <h6 className="fw-bold">UPCOMING EVENTS</h6>
</div>
        </div>

        <h5 className="fw-bold mb-4 border-bottom pb-2">ALL RECENT POST'S</h5>
        {recentPosts.map((post) => (
          <div key={post.id} className="card mb-3 border-0 border-bottom rounded-0 pb-3">
            <div className="row align-items-center">
              <div className="col-md-9">
                <h6 className="fw-bold mb-1" style={{ color: '#b22222' }}>{post.title}</h6>
                <p className="text-muted small mb-0">{post.desc}</p>
              </div>
              <div className="col-md-3 text-end">
                <img src={post.image} alt={post.title} className="rounded" style={{ width: '120px', height: '80px', objectFit: 'cover' }} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminPost;