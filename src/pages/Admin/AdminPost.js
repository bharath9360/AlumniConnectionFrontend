import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

/** * CONFIGURATION: Centralized data for categories 
 * To add a new category, simply add an object to this array.
 */
const CATEGORIES = [
  { id: 'job', title: 'Job Vacancy', icon: '💼', path: '/admin/job-vacancies' },
  { id: 'event', title: 'Upcoming Events', icon: '📢', path: '/admin/upcoming-events-list' }
];

/** * COMPONENT: CategoryCard 
 * Renders individual clickable category boxes 
 */
const CategoryCard = ({ category, onNavigate }) => (
  <div 
    className="col-md-3 card p-4 shadow-sm border-0 bg-light text-center hvr-grow" 
    style={{ cursor: 'pointer', borderRadius: '15px', transition: '0.3s' }} 
    onClick={() => onNavigate(category.path)}
  >
    <div className="fs-1 mb-2">{category.icon}</div>
    <h6 className="fw-bold mb-0 text-uppercase">{category.title}</h6>
  </div>
);

/** * COMPONENT: PostItem 
 * Renders the preview of a recent post 
 */
const PostItem = ({ data }) => (
  <div className="card mb-3 border-0 border-bottom rounded-0 pb-3">
    <div className="row align-items-center">
      <div className="col-md-9 col-8">
        <h6 className="fw-bold mb-1" style={{ color: '#b22222' }}>{data.title}</h6>
        <p className="text-muted small mb-1 text-truncate" style={{ maxWidth: '90%' }}>
          {data.description}
        </p>
        <div className="d-flex gap-3 mt-1">
          <span className="text-muted" style={{ fontSize: '11px' }}>
            <i className="fas fa-calendar-alt me-1"></i> {data.date}
          </span>
          <span className="badge bg-light text-danger border small" style={{ fontSize: '9px' }}>
            {data.type || 'EVENT'}
          </span>
        </div>
      </div>
      <div className="col-md-3 col-4 text-end">
        <img 
          src={data.image || 'https://via.placeholder.com/150?text=MAMCET'} 
          alt="post-thumbnail" 
          className="rounded shadow-sm" 
          style={{ width: '100px', height: '70px', objectFit: 'cover' }} 
        />
      </div>
    </div>
  </div>
);

/** * COMPONENT: EmptyState 
 * Displayed when no dynamic data is found 
 */
const EmptyState = ({ message }) => (
  <div className="text-center py-5 border rounded bg-light">
    <i className="fas fa-folder-open fs-1 text-muted mb-3"></i>
    <p className="text-muted">{message}</p>
  </div>
);

/** * MAIN COMPONENT: AdminPost 
 */
const AdminPost = () => {
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    /** * Fetching dynamic data from LocalStorage 
     * This avoids hardcoding post data within the UI 
     */
    const fetchPosts = () => {
      const savedEvents = JSON.parse(localStorage.getItem('adminEvents')) || [];
      // Retrieving only the latest 5 entries for the dashboard
      setPosts(savedEvents.slice(0, 5)); 
    };

    fetchPosts();
  }, []);

  return (
    <div style={{ backgroundColor: '#fff', minHeight: '100vh' }}>
      
      <div className="container py-5">
        <h4 className="text-center fw-bold mb-5" style={{ color: '#b22222', letterSpacing: '1px' }}>
          ADMIN POST DASHBOARD
        </h4>
        
        {/* Categories Section: Dynamically Mapped */}
        <div className="row justify-content-center mb-5 gap-4">
          {CATEGORIES.map((cat) => (
            <CategoryCard 
              key={cat.id} 
              category={cat} 
              onNavigate={navigate} 
            />
          ))}
        </div>

        {/* Recent Activity Section */}
        <div className="mt-5">
          <div className="d-flex justify-content-between align-items-center mb-4 border-bottom pb-2">
            <h5 className="fw-bold mb-0">ALL RECENT POST'S</h5>
            <button 
              className="btn btn-sm btn-link text-danger text-decoration-none fw-bold"
              onClick={() => navigate('/admin/upcoming-events-list')}
            >
              VIEW ALL
            </button>
          </div>
          
          <div className="px-1">
            {posts.length > 0 ? (
              posts.map((post) => <PostItem key={post.id} data={post} />)
            ) : (
              <EmptyState message="No recent posts found. Create a new event to see activity here." />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPost;