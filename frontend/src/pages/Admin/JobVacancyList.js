import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

/** * CONFIGURATION: Centralized Dynamic Data 
 */
const FILTER_CONFIG = {
  departments: ["CSE", "ECE", "IT", "MECH", "CIVIL"],
  jobTypes: ["Full Time", "Part Time", "Remote", "Internship"]
};

/** * COMPONENT: FilterSelect
 * Reusable dropdown for Department and Job Type
 */
const FilterSelect = ({ label, options, value, onChange, placeholder }) => (
  <div className="col-md-3 text-start">
    <label className="small fw-bold text-muted text-uppercase">{label}</label>
    <select 
      className="form-select shadow-sm" 
      value={value} 
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="">{placeholder}</option>
      {options.map(opt => (
        <option key={opt} value={opt}>{opt}</option>
      ))}
    </select>
  </div>
);

/** * COMPONENT: JobItem
 * Individual Job Entry Component
 */
const JobItem = ({ job, onDetailClick, formatDate }) => (
  <div className="d-flex justify-content-between align-items-center border-bottom py-4">
    <div className="text-start" style={{ width: '75%' }}>
      <h6 className="fw-bold mb-1" style={{ color: '#b22222' }}>
        {job.title} 
        <span className="text-danger fw-normal small ms-2">
          ({job.date && job.date.includes("-") ? formatDate(job.date) : job.date})
        </span>
      </h6>
      <p className="text-muted small mb-2 text-truncate">{job.description}</p>
      <div className="d-flex gap-2">
        <span className="badge bg-light text-dark border small">{job.dept}</span>
        <span className="badge bg-light text-dark border small">{job.type}</span>
      </div>
    </div>
    <button 
      className="btn btn-outline-dark btn-sm rounded shadow-sm px-3 fw-bold"
      onClick={() => onDetailClick(job)}
    >
      View Detail's
    </button>
  </div>
);

/** * COMPONENT: NoDataView
 * Displayed when the list is empty
 */
const NoDataView = () => (
  <div className="text-center py-5">
    <p className="text-muted mb-0">No jobs found matching your criteria.</p>
  </div>
);

/** * MAIN COMPONENT: JobVacancyList
 */
const JobVacancyList = () => {
  const navigate = useNavigate();
  
  // State Management
  const [allJobs, setAllJobs] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [filters, setFilters] = useState({
    department: '',
    jobType: '',
    date: ''
  });

  // Load Dynamic Data from Storage
  useEffect(() => {
    const savedJobs = JSON.parse(localStorage.getItem('adminJobs')) || [];
    setAllJobs(savedJobs);
    setFilteredJobs(savedJobs);
  }, []);

  // Filter Logic
  useEffect(() => {
    let result = allJobs;
    if (filters.department) {
      result = result.filter(job => job.dept === filters.department);
    }
    if (filters.jobType) {
      result = result.filter(job => job.type === filters.jobType);
    }
    if (filters.date) {
      result = result.filter(job => job.date === filters.date);
    }
    setFilteredJobs(result);
  }, [filters, allJobs]);

  // Utility: Date Formatter
  const formatDateForDisplay = (dateString) => {
    if(!dateString) return "";
    const [year, month, day] = dateString.split("-");
    return `${day}-${month}-${year}`; 
  };

  // Navigation Handlers
  const handleDetailNavigation = (job) => {
    navigate('/admin/job-details', { state: { job } });
  };

  return (
    <div style={{ backgroundColor: '#fff', minHeight: '100vh' }}>
      
      <div className="container py-5">
        <h4 className="text-center fw-bold mb-4" style={{ color: '#b22222' }}>JOB VACANCIES</h4>
        
        {/* Filter Section: Using FilterSelect Components */}
        <div className="row justify-content-center mb-5 g-3">
          <FilterSelect 
            label="Department"
            options={FILTER_CONFIG.departments}
            value={filters.department}
            placeholder="All Departments"
            onChange={(val) => setFilters({...filters, department: val})}
          />
          
          <FilterSelect 
            label="Job Type"
            options={FILTER_CONFIG.jobTypes}
            value={filters.jobType}
            placeholder="All Types"
            onChange={(val) => setFilters({...filters, jobType: val})}
          />

          <div className="col-md-3 text-start">
            <label className="small fw-bold text-muted text-uppercase">Posting Date</label>
            <input 
              type="date" 
              className="form-control shadow-sm" 
              value={filters.date}
              onChange={(e) => setFilters({...filters, date: e.target.value})} 
            />
          </div>
        </div>

        {/* Header Section */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h5 className="fw-bold mb-0">AVAILABLE POST'S</h5>
          <button 
            className="btn btn-danger rounded-pill px-4 fw-bold shadow-sm" 
            onClick={() => navigate('/admin/create-job')}
          >
            CREATE JOB
          </button>
        </div>

        {/* Dynamic Content: List Rendering */}
        <div className="border rounded p-3 shadow-sm bg-white">
          {filteredJobs.length > 0 ? (
            filteredJobs.map((job) => (
              <JobItem 
                key={job.id} 
                job={job} 
                formatDate={formatDateForDisplay}
                onDetailClick={handleDetailNavigation} 
              />
            ))
          ) : (
            <NoDataView />
          )}
        </div>
      </div>
    </div>
  );
};

export default JobVacancyList;