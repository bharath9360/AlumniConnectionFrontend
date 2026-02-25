import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import AdminNavbar from '../../components/admin/AdminNavbar';

/** * CONFIGURATION: Centralized data to avoid hardcoding strings inside logic
 */
const CONFIG = {
  DEPARTMENTS: ["CSE", "ECE", "IT", "MECH", "CIVIL"],
  JOB_TYPES: ["Full Time", "Part Time", "Remote", "Internship"],
  LABELS: {
    CREATE_TITLE: "CREATE NEW JOB POST",
    EDIT_TITLE: "EDIT JOB VACANCY",
    TITLE_INPUT: "JOB TITLE",
    DEPT_INPUT: "DEPARTMENT",
    TYPE_INPUT: "JOB TYPE",
    DATE_INPUT: "POSTING DATE (Manual Selection)",
    DESC_INPUT: "JOB DESCRIPTION",
    BTN_CANCEL: "CANCEL",
    BTN_POST: "POST JOB",
    BTN_UPDATE: "UPDATE POST",
    PLACEHOLDER_TITLE: "e.g. Frontend Developer",
    PLACEHOLDER_DESC: "Describe the job requirements...",
    SELECT_DEPT: "Select Dept",
    SELECT_TYPE: "Select Type"
  },
  MESSAGES: {
    VALIDATION_ERROR: "Please fill all the details! Empty posts are not allowed.",
    UPDATE_SUCCESS: "Job Updated Successfully! ✅",
    POST_SUCCESS: "Job Posted Successfully! 🚀"
  },
  STORAGE_KEY: 'adminJobs'
};

/** * COMPONENT: FormField
 * Reusable component for Label and Input/Textarea/Select
 */
const FormField = ({ label, children, className = "mb-3 text-start" }) => (
  <div className={className}>
    <label className="small fw-bold text-muted mb-1 text-uppercase">{label}</label>
    {children}
  </div>
);

/** * MAIN COMPONENT: CreateJob
 */
const CreateJob = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const editJob = location.state?.editJob;

  // Helper: Get today's date in YYYY-MM-DD format
  const getTodayDate = () => new Date().toISOString().split('T')[0];

  const [jobData, setJobData] = useState({
    title: '',
    description: '',
    dept: '',
    type: '',
    date: getTodayDate()
  });

  // Effect: Populate form if in edit mode
  useEffect(() => {
    if (editJob) {
      setJobData(editJob);
    }
  }, [editJob]);

  /** * Logic: handlePost 
   * Handles both new job creation and existing job updates
   */
  const handlePost = (e) => {
    e.preventDefault();

    // Validation Check
    const { title, description, dept, type, date } = jobData;
    if (!title.trim() || !description.trim() || !dept || !type || !date) {
      alert(CONFIG.MESSAGES.VALIDATION_ERROR);
      return;
    }

    const savedJobs = JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEY)) || [];
    
    if (editJob) {
      // Logic for updating existing job
      const updated = savedJobs.map(j => j.id === editJob.id ? jobData : j);
      localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(updated));
      alert(CONFIG.MESSAGES.UPDATE_SUCCESS);
    } else {
      // Logic for saving new job
      const newJob = { ...jobData, id: Date.now() };
      localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify([...savedJobs, newJob]));
      alert(CONFIG.MESSAGES.POST_SUCCESS);
    }
    
    navigate('/admin/job-vacancies');
  };

  return (
    <div style={{ backgroundColor: '#fff', minHeight: '100vh' }}>
      <AdminNavbar />
      
      <div className="container py-5">
        <div className="row justify-content-center">
          <div className="col-md-7 card p-5 shadow border-0" style={{ borderRadius: '20px' }}>
            
            <h4 className="fw-bold mb-4 text-center" style={{ color: '#b22222', letterSpacing: '1px' }}>
              {editJob ? CONFIG.LABELS.EDIT_TITLE : CONFIG.LABELS.CREATE_TITLE}
            </h4>

            {/* Input: Job Title */}
            <FormField label={CONFIG.LABELS.TITLE_INPUT}>
              <input 
                type="text" 
                className="form-control py-2" 
                value={jobData.title} 
                onChange={(e) => setJobData({...jobData, title: e.target.value})} 
                placeholder={CONFIG.LABELS.PLACEHOLDER_TITLE} 
              />
            </FormField>

            {/* Row: Department and Job Type */}
            <div className="row mb-3 text-start">
              <div className="col-md-6">
                <FormField label={CONFIG.LABELS.DEPT_INPUT} className="mb-0">
                  <select 
                    className="form-select" 
                    value={jobData.dept} 
                    onChange={(e) => setJobData({...jobData, dept: e.target.value})}
                  >
                    <option value="">{CONFIG.LABELS.SELECT_DEPT}</option>
                    {CONFIG.DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </FormField>
              </div>
              <div className="col-md-6">
                <FormField label={CONFIG.LABELS.TYPE_INPUT} className="mb-0">
                  <select 
                    className="form-select" 
                    value={jobData.type} 
                    onChange={(e) => setJobData({...jobData, type: e.target.value})}
                  >
                    <option value="">{CONFIG.LABELS.SELECT_TYPE}</option>
                    {CONFIG.JOB_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </FormField>
              </div>
            </div>

            {/* Input: Posting Date */}
            <FormField label={CONFIG.LABELS.DATE_INPUT}>
              <input 
                type="date" 
                className="form-control" 
                value={jobData.date} 
                onChange={(e) => {
                  const val = e.target.value;
                  const year = val.split("-")[0];
                  if (year.length <= 4) setJobData({...jobData, date: val});
                }} 
              />
            </FormField>

            {/* Input: Job Description */}
            <FormField label={CONFIG.LABELS.DESC_INPUT}>
              <textarea 
                className="form-control" 
                rows="5" 
                value={jobData.description} 
                onChange={(e) => setJobData({...jobData, description: e.target.value})} 
                placeholder={CONFIG.LABELS.PLACEHOLDER_DESC}
              />
            </FormField>

            {/* Action Buttons */}
            <div className="d-flex gap-3 mt-4">
              <button 
                className="btn btn-outline-dark w-100 fw-bold py-2 rounded-pill" 
                onClick={() => navigate(-1)}
              >
                {CONFIG.LABELS.BTN_CANCEL}
              </button>
              <button 
                className="btn btn-danger w-100 fw-bold py-2 rounded-pill shadow" 
                onClick={handlePost}
              >
                {editJob ? CONFIG.LABELS.BTN_UPDATE : CONFIG.LABELS.BTN_POST}
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateJob;