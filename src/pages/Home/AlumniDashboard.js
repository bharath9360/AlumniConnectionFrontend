import React from 'react';
import { Link } from 'react-router-dom';
import '../../styles/Dashboard.css';

/**
 * AlumniDashboard Component
 * Custom design based on MAMCET Alumni branding.
 * Layout: 3-Column (Profile | Main Feed | Updates)
 */
const AlumniDashboard = () => {
  const user = { name: "Bharath K", role: "Software Engineer", company: "HILIFE AI", batch: "2020-2024" };

  // Industry-standard dummy data list
  const ALUMNI_FEED = [
    {
      id: 1,
      user: "MAMCET Placement Cell",
      title: "New Job Opportunity",
      content: "Exciting news! TCS is conducting a pooled campus drive for 2024/25 graduates. Check the jobs tab for details.",
      time: "10 mins ago",
      type: "official"
    },
    {
      id: 2,
      user: "Dr. S. Kumar",
      title: "Department Update",
      content: "Our CSE department just received a new R&D grant. Looking for alumni mentors to guide final year projects.",
      time: "2 hours ago",
      type: "academic"
    },
    {
      id: 3,
      user: "Admin",
      title: "Event Reminder",
      content: "Don't forget to RSVP for the Annual Alumni Meet '26. Let's make it a grand success!",
      time: "5 hours ago",
      type: "event"
    },
    {
      id: 4,
      user: "Alumni Student",
      title: "Tech Talk",
      content: "I'll be hosting a webinar on 'MERN Stack Industry Trends' this weekend. Join the link in bio.",
      time: "1 day ago",
      type: "general"
    }
  ];

  return (
    <div className="dashboard-main-bg py-4">
      <div className="container">
        <div className="row g-4">
          
          {/* LEFT SECTION: Profile Summary */}
          <div className="col-lg-3">
            <div className="dashboard-card profile-card text-center p-0 overflow-hidden shadow-sm bg-white">
              <div className="profile-top-banner"></div>
              <div className="profile-avatar-main">B</div>
              <div className="p-3 pt-5">
                <h5 className="fw-bold mb-0 mt-2">{user.name}</h5>
                <p className="small text-muted mb-3">{user.role} at {user.company}</p>
                <div className="divider-line"></div>
                <div className="text-start mt-3">
                  <p className="small mb-2 d-flex justify-content-between">
                    <span>Profile Views</span> <span className="brand-red-text fw-bold">42</span>
                  </p>
                  <p className="small mb-0 d-flex justify-content-between">
                    <span>Connections</span> <span className="brand-red-text fw-bold">150+</span>
                  </p>
                </div>
              </div>
            </div>

            <div className="dashboard-card mt-3 p-3 shadow-sm bg-white">
              <h6 className="fw-bold mb-3 small">QUICK LINKS</h6>
              <div className="d-grid gap-2">
                <Link to="/jobs" className="btn btn-light btn-sm text-start"><i className="fas fa-briefcase me-2 text-danger"></i> My Jobs</Link>
                <Link to="/events" className="btn btn-light btn-sm text-start"><i className="fas fa-calendar-alt me-2 text-danger"></i> My Events</Link>
              </div>
            </div>
          </div>

          {/* MIDDLE SECTION: Scrollable Feed */}
          <div className="col-lg-6">
            {/* Post Creation Area */}
            <div className="dashboard-card mb-4 p-3 shadow-sm bg-white">
              <div className="d-flex align-items-center">
                <div className="avatar-sm me-3">B</div>
                <button className="post-input-btn w-100 text-start text-muted">
                  Share an update or job opportunity...
                </button>
              </div>
            </div>

            {/* Feed List */}
            <div className="feed-scroll-area">
              {ALUMNI_FEED.map(post => (
                <div key={post.id} className="dashboard-card mb-3 p-4 shadow-sm bg-white post-item">
                  <div className="d-flex align-items-center mb-3">
                    <div className="avatar-sm me-3 bg-secondary text-white">{post.user[0]}</div>
                    <div>
                      <h6 className="fw-bold mb-0">{post.user}</h6>
                      <p className="extra-small text-muted">{post.time}</p>
                    </div>
                  </div>
                  <h6 className="fw-bold brand-red-text">{post.title}</h6>
                  <p className="small text-dark">{post.content}</p>
                  <div className="post-actions-bar border-top pt-2 mt-3 d-flex justify-content-around">
                    <button className="btn btn-sm text-muted"><i className="far fa-thumbs-up me-1"></i> Like</button>
                    <button className="btn btn-sm text-muted"><i className="far fa-comment-alt me-1"></i> Comment</button>
                    <button className="btn btn-sm text-muted"><i className="fas fa-share me-1"></i> Share</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT SECTION: News & Events */}
          <div className="col-lg-3">
            <div className="dashboard-card p-3 shadow-sm bg-white mb-3">
              <h6 className="fw-bold mb-3 small">COLLEGE NEWS</h6>
              <div className="news-item-compact mb-3">
                <p className="mb-0 small fw-bold">Symposium '25</p>
                <span className="extra-small text-muted">Jan 12, 2026</span>
              </div>
              <div className="news-item-compact mb-3">
                <p className="mb-0 small fw-bold">New Lab Inauguration</p>
                <span className="extra-small text-muted">Dec 20, 2025</span>
              </div>
              <button className="btn btn-sm btn-outline-danger w-100 fw-bold">More News</button>
            </div>

            <div className="dashboard-card p-3 shadow-sm bg-white">
              <h6 className="fw-bold mb-3 small">UPCOMING EVENTS</h6>
              <div className="event-item-sidebar mb-2 p-2 rounded bg-light border-start border-danger border-4">
                <p className="mb-0 extra-small fw-bold">Alumni Network Night</p>
              </div>
              <div className="event-item-sidebar mb-2 p-2 rounded bg-light">
                <p className="mb-0 extra-small fw-bold">Career Fair '26</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default AlumniDashboard;