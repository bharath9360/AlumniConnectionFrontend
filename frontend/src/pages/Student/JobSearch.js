import React, { useState, useEffect } from 'react';
import { storage } from '../../utils/storage';
import Modal from '../../components/common/Modal';
import Toast from '../../components/common/Toast';
const JobPostings = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState(null);
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [isJobDetailsOpen, setIsJobDetailsOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = React.useRef(null);
  const [toast, setToast] = useState(null);
  const [activeTab, setActiveTab] = useState('all'); // Added state for tabs

  useEffect(() => {
    setJobs(storage.getJobs());
    setLoading(false);
  }, []);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  const handleApply = (jobId) => {
    const updatedJobs = jobs.map(job => {
      if (job.id === jobId) return { ...job, applied: true };
      return job;
    });
    setJobs(updatedJobs);
    storage.saveJobs(updatedJobs);
    setIsApplyModalOpen(false);
    setSelectedFile(null);
    showToast("Application submitted successfully!", "success");
  };

  const handleSaveJob = (jobId) => {
    const updatedJobs = jobs.map(job => {
      if (job.id === jobId) return { ...job, saved: !job.saved };
      return job;
    });
    setJobs(updatedJobs);
    storage.saveJobs(updatedJobs);
    const isSaved = updatedJobs.find(j => j.id === jobId)?.saved;
    showToast(isSaved ? "Job saved to your list!" : "Job removed from saved list.", "success");
  };

  const filteredJobs = activeTab === 'all' ? jobs : jobs.filter(job => job.saved);

  if (loading) return <div className="p-5 text-center">Loading Job Openings...</div>;

  return (
    <div className="dashboard-main-bg py-5 min-vh-100">
      <div className="container">
        <div className="d-flex flex-column align-items-center text-center mb-4">
          <h2 className="fw-bold mb-0 text-dark">Job Opportunities</h2>
          <p className="text-muted small">Explore roles shared by your alumni network.</p>
        </div>

        {/* Tab Navigation */}
        <div className="d-flex justify-content-center mb-5">
          <div className="btn-group bg-white p-1 shadow-sm rounded-pill" style={{ minWidth: '300px' }}>
            <button 
              className={`btn rounded-pill px-4 fw-bold transition ${activeTab === 'all' ? 'btn-mamcet-red text-white' : 'btn-light text-muted border-0'}`}
              onClick={() => setActiveTab('all')}
            >
              Explore Jobs
            </button>
            <button 
              className={`btn rounded-pill px-4 fw-bold transition ${activeTab === 'saved' ? 'btn-mamcet-red text-white' : 'btn-light text-muted border-0'}`}
              onClick={() => setActiveTab('saved')}
            >
              Saved Jobs
            </button>
          </div>
        </div>

        <div className="row g-4">
          <div className="col-lg-8 mx-auto">
            {filteredJobs.length > 0 ? (
              filteredJobs.map(job => (
                <div key={job.id} className="dashboard-card bg-white shadow-sm border-0 rounded-3 p-4 mb-3 d-flex flex-column flex-md-row gap-4 align-items-start border-hover-red transition">
                  <div className="job-logo bg-light rounded d-flex align-items-center justify-content-center" style={{ minWidth: '80px', height: '80px' }}>
                    <i className="fas fa-building text-secondary fs-2"></i>
                  </div>
                  <div className="flex-grow-1 w-100">
                    <div className="d-flex justify-content-between">
                      <h5 className="fw-bold text-mamcet-red mb-1">{job.title}</h5>
                      <span className="extra-small text-muted fw-bold">{job.timestamp}</span>
                    </div>
                    <h6 className="fw-bold text-dark mb-1">{job.company}</h6>
                    <p className="extra-small text-muted mb-3">
                      <i className="fas fa-map-marker-alt me-1"></i> {job.location} &bull; <i className="fas fa-briefcase me-1"></i> {job.type}
                    </p>

                    <div className="d-flex flex-wrap gap-2 mb-3">
                      {job.skills?.map((skill, idx) => (
                        <span key={idx} className="badge bg-light text-dark extra-small border fw-normal">{skill}</span>
                      ))}
                    </div>

                    <div className="p-3 bg-light rounded-3 mb-3 border">
                      <div className="row g-2 extra-small mb-0">
                        <div className="col-6"><strong>Exp:</strong> {job.experience}</div>
                        <div className="col-6"><strong>Salary:</strong> {job.salary}</div>
                        <div className="col-12 mt-2"><strong>Posted by:</strong> {job.postedBy}</div>
                      </div>
                    </div>

                    <div className="d-flex gap-3 mt-2">
                      <button
                        className="btn btn-pro btn-pro-primary btn-pro-sm px-4"
                        onClick={() => { setSelectedJob(job); setIsJobDetailsOpen(true); }}
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-5 bg-white rounded-3 shadow-sm border">
                <div className="mb-3 text-muted">
                  <i className="fas fa-briefcase fs-1 opacity-25"></i>
                </div>
                <h5 className="fw-bold text-dark">No {activeTab === 'saved' ? 'saved ' : ''}jobs found</h5>
                <p className="text-muted small">
                  {activeTab === 'saved' 
                    ? "Go back to Explore Jobs to save some opportunities!" 
                    : "No jobs are currently available. Check back later."}
                </p>
                {activeTab === 'saved' && (
                  <button className="btn btn-pro-primary btn-pro-sm px-4 mt-2" onClick={() => setActiveTab('all')}>
                    Explore Jobs
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MODALS */}
      <Modal
        isOpen={isApplyModalOpen}
        onClose={() => setIsApplyModalOpen(false)}
        title="Apply for Position"
        footer={<button className="btn btn-mamcet-red px-4 rounded-pill fw-bold" onClick={() => handleApply(selectedJob.id)}>Submit Application</button>}
      >
        <div className="p-3 bg-light rounded-3 mb-4">
          <h6 className="fw-bold mb-1">{selectedJob?.title}</h6>
          <p className="extra-small text-muted mb-0">{selectedJob?.company} &bull; {selectedJob?.location}</p>
        </div>
        <div className="mb-3">
          <label className="form-label extra-small fw-bold">Cover Letter / Note</label>
          <textarea className="form-control" rows="4" placeholder="Briefly mention why you are a good fit..."></textarea>
        </div>
        <div className="mb-3">
          <label className="form-label extra-small fw-bold">Attach Resume (PDF, DOC, DOCX)</label>
          <div className="d-flex align-items-center gap-2">
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm rounded-pill px-3"
              onClick={() => fileInputRef.current?.click()}
            >
              <i className="fas fa-paperclip me-2"></i>
              {selectedFile ? 'Change File' : 'Upload Resume'}
            </button>
            <input
              type="file"
              ref={fileInputRef}
              className="d-none"
              accept=".pdf,.doc,.docx"
              onChange={(e) => setSelectedFile(e.target.files[0])}
            />
            {selectedFile && (
              <span className="extra-small text-success fw-bold text-truncate" style={{ maxWidth: '200px' }}>
                <i className="fas fa-check-circle me-1"></i> {selectedFile.name}
              </span>
            )}
          </div>
        </div>
        <p className="extra-small text-muted">Your MAMCET alumni profile will be shared with the recruiter automatically.</p>
      </Modal>

      {/* JOB DETAILS MODAL */}
      <Modal
        isOpen={isJobDetailsOpen}
        onClose={() => setIsJobDetailsOpen(false)}
        title="Job Details"
        footer={
          <div className="d-flex gap-2 w-100 justify-content-end">
            <button 
              className={`btn ${selectedJob?.saved ? 'btn-danger opacity-75' : 'btn-outline-secondary'} rounded-pill px-4 fw-bold`}
              onClick={() => handleSaveJob(selectedJob?.id)}
            >
              <i className={`fas fa-bookmark me-2 ${selectedJob?.saved ? 'text-white' : ''}`}></i>
              {selectedJob?.saved ? 'Unsave' : 'Save Job'}
            </button>
            <button 
              className={`btn ${selectedJob?.applied ? 'btn-success' : 'btn-mamcet-red'} px-4 rounded-pill fw-bold`}
              onClick={() => { setIsJobDetailsOpen(false); setIsApplyModalOpen(true); }}
              disabled={selectedJob?.applied}
            >
              {selectedJob?.applied ? 'Already Applied' : 'Apply Now'}
            </button>
          </div>
        }
      >
        {selectedJob && (
          <div className="job-details-content">
            <div className="d-flex align-items-start gap-3 mb-4 p-3 bg-light rounded-3">
              <div className="bg-white p-3 rounded shadow-sm">
                <i className="fas fa-building text-secondary fs-3"></i>
              </div>
              <div>
                <h5 className="fw-bold text-mamcet-red mb-1">{selectedJob.title}</h5>
                <h6 className="fw-bold text-dark mb-1">{selectedJob.company}</h6>
                <p className="extra-small text-muted mb-0">
                  <i className="fas fa-map-marker-alt me-1"></i> {selectedJob.location} &bull; <i className="fas fa-briefcase me-1"></i> {selectedJob.type}
                </p>
              </div>
            </div>

            <div className="row g-3 mb-4">
              <div className="col-md-6">
                <div className="p-3 border rounded-3 bg-white h-100">
                  <p className="extra-small text-muted mb-1 fw-bold">EXPERIENCE</p>
                  <p className="mb-0 fw-bold">{selectedJob.experience}</p>
                </div>
              </div>
              <div className="col-md-6">
                <div className="p-3 border rounded-3 bg-white h-100">
                  <p className="extra-small text-muted mb-1 fw-bold">SALARY</p>
                  <p className="mb-0 fw-bold text-success">{selectedJob.salary}</p>
                </div>
              </div>
            </div>

            <div className="mb-4">
              <h6 className="fw-bold mb-3 d-flex align-items-center">
                <span className="bg-mamcet-red rounded-circle p-1 me-2" style={{ width: '8px', height: '8px' }}></span>
                Job Description
              </h6>
              <div className="p-3 bg-white border rounded-3 text-muted" style={{ lineHeight: '1.6' }}>
                {selectedJob.description}
              </div>
            </div>

            <div className="mb-4">
              <h6 className="fw-bold mb-3 d-flex align-items-center">
                <span className="bg-mamcet-red rounded-circle p-1 me-2" style={{ width: '8px', height: '8px' }}></span>
                Required Skills
              </h6>
              <div className="d-flex flex-wrap gap-2">
                {selectedJob.skills?.map((skill, idx) => (
                  <span key={idx} className="badge bg-light text-dark px-3 py-2 border fw-normal rounded-pill">
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            <div className="extra-small text-muted p-3 bg-light rounded-3">
              <div className="d-flex justify-content-between mb-1">
                <span>Posted by: <strong>{selectedJob.postedBy}</strong></span>
                <span>Posted: <strong>{selectedJob.timestamp}</strong></span>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* TOAST NOTIFICATION */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};

export default JobPostings;
