import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import '../../styles/Dashboard.css';

/**
 * JobPostings Component
 * Displays available job opportunities shared by Alumni and Placement Cell.
 * Features: Search, Filter, and Post Job functionality.
 */
const JobPostings = () => {
  // Dummy data representing Job openings
  const JOBS_DATA = [
    {
      id: 1,
      title: "Full Stack Developer",
      company: "HILIFE AI",
      location: "Trichy, Tamil Nadu (On-site)",
      type: "Full-time",
      postedBy: "Bharath K (Alumni)",
      salary: "₹6L - ₹10L PA",
      description: "Looking for MERN stack developers with 1-2 years of experience. Juniors from MAMCET are encouraged to apply."
    },
    {
      id: 2,
      title: "Graduate Engineer Trainee",
      company: "TCS",
      location: "Chennai, Tamil Nadu",
      type: "Full-time",
      postedBy: "MAMCET Placement Cell",
      salary: "Competitive",
      description: "Pooled campus drive for 2025 batch. Mandatory skills: Java, Aptitude, and Communication."
    },
    {
      id: 3,
      title: "UI/UX Designer Intern",
      company: "Creative Studio",
      location: "Remote",
      type: "Internship",
      postedBy: "Priya S (Alumni)",
      salary: "₹15k - ₹20k Stipend",
      description: "Passionate about design? Join our team for a 6-month internship. Portfolio is mandatory."
    }
  ];

  return (
    <div className="dashboard-main-bg py-4 min-vh-100">
      <div className="container">
        <div className="row g-4">
          
          {/* LEFT: Search & Filters */}
          <div className="col-lg-3">
            <div className="dashboard-card p-4 shadow-sm bg-white sticky-sidebar-top">
              <h6 className="fw-bold mb-3 small">SEARCH FILTERS</h6>
              <div className="mb-3">
                <label className="form-label extra-small fw-bold">Job Title / Skill</label>
                <input type="text" className="form-control form-control-sm" placeholder="e.g. React, Java" />
              </div>
              <div className="mb-3">
                <label className="form-label extra-small fw-bold">Location</label>
                <input type="text" className="form-control form-control-sm" placeholder="e.g. Trichy, Remote" />
              </div>
              <button className="btn btn-mamcet-red w-100 btn-sm fw-bold mt-2">Apply Filters</button>
            </div>
          </div>

          {/* MIDDLE: Job List */}
          <div className="col-lg-6">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h4 className="fw-bold mb-0 text-dark">Job Opportunities</h4>
              <button className="btn btn-dark btn-sm rounded-pill px-3 fw-bold">
                <i className="fas fa-plus me-2"></i>Post a Job
              </button>
            </div>

            <div className="job-feed-area">
              {JOBS_DATA.map(job => (
                <div key={job.id} className="dashboard-card mb-3 p-4 shadow-sm bg-white post-item border-start border-danger border-5">
                  <div className="d-flex justify-content-between">
                    <div>
                      <h5 className="fw-bold brand-red-text mb-1">{job.title}</h5>
                      <h6 className="fw-bold text-dark small mb-2">{job.company}</h6>
                      <p className="extra-small text-muted mb-2">
                        <i className="fas fa-map-marker-alt me-1"></i> {job.location} | 
                        <i className="fas fa-briefcase ms-2 me-1"></i> {job.type}
                      </p>
                    </div>
                    <div className="text-end">
                      <span className="badge bg-light text-dark border extra-small">{job.salary}</span>
                    </div>
                  </div>
                  
                  <p className="small text-muted mt-2 mb-3 text-truncate-2">
                    {job.description}
                  </p>
                  
                  <div className="divider-line mb-3"></div>
                  
                  <div className="d-flex justify-content-between align-items-center">
                    <span className="extra-small text-muted">Posted by: <b>{job.postedBy}</b></span>
                    <div>
                      <button className="btn btn-outline-danger btn-sm fw-bold me-2 px-3">Details</button>
                      <button className="btn btn-mamcet-red btn-sm fw-bold px-4">Apply Now</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT: Stats & Links */}
          <div className="col-lg-3">
            <div className="dashboard-card p-3 shadow-sm bg-white mb-3">
              <h6 className="fw-bold mb-3 small">JOB STATISTICS</h6>
              <div className="d-flex justify-content-between mb-2">
                <span className="small">Jobs Posted</span>
                <span className="fw-bold brand-red-text">124</span>
              </div>
              <div className="d-flex justify-content-between mb-2">
                <span className="small">Applications Sent</span>
                <span className="fw-bold brand-red-text">1,500+</span>
              </div>
            </div>

            <div className="dashboard-card p-3 shadow-sm bg-white">
              <h6 className="fw-bold mb-3 small">MAMCET PLACEMENT</h6>
              <p className="extra-small text-muted mb-3">Get in touch with the placement coordinator for direct campus interview schedules.</p>
              <a href="mailto:placement@mamcet.com" className="brand-red-text small fw-bold text-decoration-none">placement@mamcet.com</a>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default JobPostings;