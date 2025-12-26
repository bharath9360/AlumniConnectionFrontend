import React from 'react';
import '../../styles/Dashboard.css';

/**
 * JobPostings Component
 * Updated with all fields from the design: Title, Company, Experience, Salary, Location, and Skills.
 */
const JobPostings = () => {
  const JOBS_DATA = [
    {
      id: 1,
      title: "Software Development Engineer",
      company: "HILIFE AI",
      experience: "0 - 2 Years",
      salary: "₹6,00,000 - ₹10,00,000 PA",
      location: "Trichy, Tamil Nadu",
      skills: ["React.js", "Node.js", "MongoDB", "Express"],
      postedDate: "2 days ago",
      description: "We are looking for a skilled developer to join our product team. Candidates with internship experience in MERN stack will be preferred."
    },
    {
      id: 2,
      title: "Associate Systems Engineer",
      company: "TCS",
      experience: "Freshers (2025 Batch)",
      salary: "₹3,50,000 - ₹4,50,000 PA",
      location: "Chennai / Bangalore",
      skills: ["Java", "Python", "SQL", "Aptitude"],
      postedDate: "5 hours ago",
      description: "TCS is hiring for the next-gen engineering roles. Strong logical reasoning and coding fundamentals are expected."
    }
  ];

  return (
    <div className="dashboard-main-bg py-5">
      <div className="container">
        <div className="row g-4 justify-content-center">
          
          <div className="col-lg-8">
            {/* Header Section */}
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h4 className="fw-bold text-dark">Job Opportunities for Alumni & Students</h4>
              <button className="btn btn-dark btn-sm rounded-pill px-4 fw-bold">
                <i className="fas fa-plus me-2"></i>Post a Job
              </button>
            </div>

            {/* Job Cards Area */}
            <div className="job-list-wrapper">
              {JOBS_DATA.map(job => (
                <div key={job.id} className="job-card-professional mb-4 shadow-sm bg-white">
                  <div className="p-4">
                    {/* Top Row: Title & Salary */}
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <div>
                        <h5 className="job-title-text mb-1">{job.title}</h5>
                        <h6 className="company-name-text">{job.company}</h6>
                      </div>
                      <span className="salary-badge-pro">{job.salary}</span>
                    </div>

                    {/* Middle Row: Meta Info (Exp & Location) */}
                    <div className="d-flex gap-4 text-muted extra-small mb-3 mt-3">
                      <span><i className="fas fa-briefcase me-2"></i><b>Exp:</b> {job.experience}</span>
                      <span><i className="fas fa-map-marker-alt me-2"></i><b>Location:</b> {job.location}</span>
                    </div>

                    {/* Skills Section */}
                    <div className="skills-tag-wrapper mb-3 d-flex flex-wrap gap-2">
                      {job.skills.map((skill, index) => (
                        <span key={index} className="skill-tag-item">{skill}</span>
                      ))}
                    </div>

                    {/* Description Section */}
                    <p className="job-desc-text text-muted small">
                      {job.description}
                    </p>

                    {/* Footer Row: Meta & Actions */}
                    <div className="d-flex justify-content-between align-items-center mt-3 pt-3 border-top">
                      <span className="extra-small text-muted italic">Posted: {job.postedDate}</span>
                      <div className="d-flex gap-2">
                        <button className="btn btn-outline-secondary btn-sm px-3 fw-bold">View Details</button>
                        <button className="btn btn-apply-professional px-4">Apply Now</button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default JobPostings;