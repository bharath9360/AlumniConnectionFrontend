import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import AdminNavbar from '../../components/admin/AdminNavbar';

/** * CONSTANTS: Centralized text data to avoid hardcoding inside components
 */
const TEXT_LABELS = {
  BACK_BUTTON: "BACK TO VACANCIES",
  POSTED_PREFIX: "Posted:",
  DESC_TITLE: "JOB DESCRIPTION",
  DELETE_BTN: "DELETE POST",
  EDIT_BTN: "EDIT DETAILS",
  CONFIRM_DELETE: "Are you sure you want to delete this job?",
  DELETE_SUCCESS: "Job Deleted Successfully!",
  ERROR_MSG: "No Job Details Found"
};

/** * COMPONENT: BackButton */
const BackButton = ({ onClick, label }) => (
  <button className="btn btn-link text-decoration-none text-dark fw-bold mb-4" onClick={onClick}>
    <i className="fas fa-arrow-left me-2"></i> {label}
  </button>
);

/** * COMPONENT: JobHeader */
const JobHeader = ({ title, timestamp, prefix }) => (
  <>
    <h3 className="fw-bold mb-1" style={{ color: '#b22222' }}>{title}</h3>
    <p className="text-muted fw-bold small">{prefix} {timestamp}</p>
    <hr />
  </>
);

/** * COMPONENT: JobContent */
const JobContent = ({ title, description }) => (
  <div className="mt-4">
    <h6 className="fw-bold text-dark mb-3 text-uppercase">{title}</h6>
    <p className="text-muted lh-lg">{description}</p>
  </div>
);

/** * COMPONENT: ActionButtons */
const ActionButtons = ({ onDelete, onEdit, deleteLabel, editLabel }) => (
  <div className="mt-5 d-flex justify-content-end gap-3">
    <button className="btn btn-outline-danger px-4 fw-bold shadow-sm" onClick={onDelete}>
      {deleteLabel}
    </button>
    <button className="btn btn-danger px-4 fw-bold shadow-sm" onClick={onEdit}>
      {editLabel}
    </button>
  </div>
);

/** * COMPONENT: ErrorView */
const ErrorView = ({ message }) => (
  <div className="text-center py-5">
    <h4>{message}</h4>
  </div>
);

/** * MAIN COMPONENT: JobDetailsView
 */
const JobDetailsView = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const job = location.state?.job;

  // Logic: Handle missing data
  if (!job) {
    return <ErrorView message={TEXT_LABELS.ERROR_MSG} />;
  }

  /** * FUNCTION: handleDelete 
   * Logic remains the same, but strings are pulled from TEXT_LABELS
   */
  const handleDelete = () => {
    if (window.confirm(TEXT_LABELS.CONFIRM_DELETE)) {
      const savedJobs = JSON.parse(localStorage.getItem('adminJobs')) || [];
      const updatedJobs = savedJobs.filter(item => item.id !== job.id);
      
      localStorage.setItem('adminJobs', JSON.stringify(updatedJobs));
      alert(TEXT_LABELS.DELETE_SUCCESS);
      navigate('/admin/job-vacancies');
    }
  };

  /** * FUNCTION: handleEdit 
   */
  const handleEdit = () => {
    navigate('/admin/create-job', { state: { editJob: job } });
  };

  return (
    <div style={{ backgroundColor: '#fff', minHeight: '100vh' }}>
      <AdminNavbar />
      
      <div className="container py-5">
        <BackButton 
          onClick={() => navigate(-1)} 
          label={TEXT_LABELS.BACK_BUTTON} 
        />

        <div className="row justify-content-center">
          <div className="col-md-8">
            <div className="card shadow-sm border-0 p-5 rounded-4 bg-white">
              
              <JobHeader 
                title={job.title} 
                timestamp={job.time || job.date} 
                prefix={TEXT_LABELS.POSTED_PREFIX}
              />
              
              <JobContent 
                title={TEXT_LABELS.DESC_TITLE}
                description={job.description} 
              />

              <ActionButtons 
                onDelete={handleDelete} 
                onEdit={handleEdit}
                deleteLabel={TEXT_LABELS.DELETE_BTN}
                editLabel={TEXT_LABELS.EDIT_BTN}
              />
              
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobDetailsView;