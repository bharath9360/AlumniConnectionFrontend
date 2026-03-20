import React, { useState, useEffect } from 'react';
import { jobService } from '../../services/api';
import Modal from '../../components/common/Modal';
import Toast from '../../components/common/Toast';
import { ClipLoader } from 'react-spinners';

const JobPostings = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState(null);
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const [newJob, setNewJob] = useState({
    title: '', company: '', location: '', type: 'Full-time',
    experience: '', salary: '', description: '', skills: ''
  });

  const showToast = (message, type = 'success') => setToast({ message, type });

  useEffect(() => {
    const load = async () => {
      try {
        const res = await jobService.getJobs();
        setJobs(res.data.data || []);
      } catch (err) {
        showToast('Failed to load jobs. Please refresh.', 'error');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleApply = async (jobId) => {
    setActionLoading(true);
    try {
      await jobService.applyJob(jobId);
      setJobs(prev => prev.map(j => (j._id === jobId || j.id === jobId) ? { ...j, applied: true } : j));
      setIsApplyModalOpen(false);
      showToast('Application submitted successfully!', 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Application failed.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handlePostJob = async () => {
    if (!newJob.title || !newJob.company) {
      showToast('Please fill in the title and company name.', 'error');
      return;
    }
    setActionLoading(true);
    try {
      const res = await jobService.createJob(newJob);
      setJobs(prev => [res.data.data, ...prev]);
      setIsPostModalOpen(false);
      showToast('Job posted successfully!', 'success');
      setNewJob({ title: '', company: '', location: '', type: 'Full-time', experience: '', salary: '', description: '', skills: '' });
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to post job.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="dashboard-main-bg min-vh-100 d-flex align-items-center justify-content-center">
        <ClipLoader color="#c84022" size={45} />
      </div>
    );
  }

  return (
    <div className="dashboard-main-bg py-5 min-vh-100">
      <div className="container">
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-5 gap-3">
          <div>
            <h2 className="fw-bold mb-0 text-dark">Job Opportunities</h2>
            <p className="text-muted small">Explore roles shared by your alumni network.</p>
          </div>
          <button className="btn btn-mamcet-red px-4 fw-bold rounded-pill" onClick={() => setIsPostModalOpen(true)}>
            <i className="fas fa-plus me-2"></i>Post a Job
          </button>
        </div>

        <div className="row g-4">
          <div className="col-lg-8 mx-auto">
            {jobs.length === 0 ? (
              <div className="text-center p-5 bg-white rounded-3 shadow-sm">
                <p className="text-muted">No job postings yet. Be the first to post one!</p>
              </div>
            ) : jobs.map(job => (
              <div key={job._id || job.id} className="dashboard-card bg-white shadow-sm border-0 rounded-3 p-4 mb-3 d-flex flex-column flex-md-row gap-4 align-items-start">
                <div className="job-logo bg-light rounded d-flex align-items-center justify-content-center" style={{ minWidth: '80px', height: '80px' }}>
                  <i className="fas fa-building text-secondary fs-2"></i>
                </div>
                <div className="flex-grow-1">
                  <div className="d-flex justify-content-between">
                    <h5 className="fw-bold text-mamcet-red mb-1">{job.title}</h5>
                    <span className="extra-small text-muted fw-bold">{job.timestamp || 'Recent'}</span>
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
                      <div className="col-12 mt-2"><strong>Posted by:</strong> {job.postedByName}</div>
                    </div>
                  </div>
                  <div className="d-flex gap-3 mt-2">
                    <button
                      className={`btn btn-pro ${job.applied ? 'btn-success' : 'btn-pro-primary'} btn-pro-sm px-4`}
                      onClick={() => { setSelectedJob(job); setIsApplyModalOpen(true); }}
                      disabled={job.applied}
                    >
                      {job.applied ? 'Already Applied' : 'Apply Now'}
                    </button>
                    <button className="btn btn-pro btn-pro-outline btn-pro-sm px-4">Save Job</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Apply Modal */}
      <Modal isOpen={isApplyModalOpen} onClose={() => setIsApplyModalOpen(false)} title="Apply for Position"
        footer={
          <button className="btn btn-mamcet-red px-4 rounded-pill fw-bold d-flex align-items-center gap-2" onClick={() => handleApply(selectedJob._id || selectedJob.id)} disabled={actionLoading}>
            {actionLoading ? <ClipLoader size={14} color="#fff" /> : null} Submit Application
          </button>
        }>
        <div className="p-3 bg-light rounded-3 mb-4">
          <h6 className="fw-bold mb-1">{selectedJob?.title}</h6>
          <p className="extra-small text-muted mb-0">{selectedJob?.company} &bull; {selectedJob?.location}</p>
        </div>
        <div className="mb-3">
          <label className="form-label extra-small fw-bold">Cover Letter / Note</label>
          <textarea className="form-control" rows="4" placeholder="Briefly mention why you are a good fit..."></textarea>
        </div>
        <p className="extra-small text-muted">Your MAMCET alumni profile will be shared with the recruiter automatically.</p>
      </Modal>

      {/* Post Job Modal */}
      <Modal isOpen={isPostModalOpen} onClose={() => setIsPostModalOpen(false)} title="Post a New Job Opening"
        footer={
          <button className="btn btn-mamcet-red px-4 rounded-pill fw-bold d-flex align-items-center gap-2" onClick={handlePostJob} disabled={actionLoading}>
            {actionLoading ? <ClipLoader size={14} color="#fff" /> : null} Publish Job
          </button>
        }>
        <div className="row g-3">
          <div className="col-md-7"><label className="form-label extra-small fw-bold">Job Title</label><input type="text" className="form-control" value={newJob.title} onChange={(e) => setNewJob({ ...newJob, title: e.target.value })} /></div>
          <div className="col-md-5"><label className="form-label extra-small fw-bold">Company Name</label><input type="text" className="form-control" value={newJob.company} onChange={(e) => setNewJob({ ...newJob, company: e.target.value })} /></div>
          <div className="col-md-6"><label className="form-label extra-small fw-bold">Location</label><input type="text" className="form-control" placeholder="e.g. Bangalore, Remote" value={newJob.location} onChange={(e) => setNewJob({ ...newJob, location: e.target.value })} /></div>
          <div className="col-md-6"><label className="form-label extra-small fw-bold">Job Type</label>
            <select className="form-select" value={newJob.type} onChange={(e) => setNewJob({ ...newJob, type: e.target.value })}>
              <option>Full-time</option><option>Contract</option><option>Internship</option>
            </select>
          </div>
          <div className="col-md-6"><label className="form-label extra-small fw-bold">Exp. Required</label><input type="text" className="form-control" placeholder="e.g. 2-5 Years" value={newJob.experience} onChange={(e) => setNewJob({ ...newJob, experience: e.target.value })} /></div>
          <div className="col-md-6"><label className="form-label extra-small fw-bold">Salary Range</label><input type="text" className="form-control" placeholder="e.g. 10-15 LPA" value={newJob.salary} onChange={(e) => setNewJob({ ...newJob, salary: e.target.value })} /></div>
          <div className="col-12"><label className="form-label extra-small fw-bold">Skills (comma separated)</label><input type="text" className="form-control" placeholder="React, Node.js, AI" value={newJob.skills} onChange={(e) => setNewJob({ ...newJob, skills: e.target.value })} /></div>
          <div className="col-12"><label className="form-label extra-small fw-bold">Description</label><textarea className="form-control" rows="3" value={newJob.description} onChange={(e) => setNewJob({ ...newJob, description: e.target.value })}></textarea></div>
        </div>
      </Modal>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};

export default JobPostings;
