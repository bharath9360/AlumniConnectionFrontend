import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminNavbar from '../../components/admin/AdminNavbar';

const JobVacancyList = () => {
  const navigate = useNavigate();
  
  // --- DYNAMIC DATA SOURCE (இங்க மாத்துனா போதும், எல்லா இடத்துலயும் மாறும்) ---
  const [filterOptions] = useState({
    departments: ["CSE", "ECE", "IT", "MECH", "CIVIL"],
    jobTypes: ["Full Time", "Part Time", "Remote", "Internship"]
  });

  const [allJobs, setAllJobs] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState([]);
  
  const [filters, setFilters] = useState({
    department: '',
    jobType: '',
    date: ''
  });

  useEffect(() => {
    // LocalStorage-ல இருந்து டைனமிக்கா டேட்டாவை எடுக்கிறோம்
    const savedJobs = JSON.parse(localStorage.getItem('adminJobs')) || [];
    setAllJobs(savedJobs);
    setFilteredJobs(savedJobs);
  }, []);

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

  const formatDateForDisplay = (dateString) => {
    if(!dateString) return "";
    const [year, month, day] = dateString.split("-");
    return `${day}-${month}-${year}`; 
  };

  return (
    <div style={{ backgroundColor: '#fff', minHeight: '100vh' }}>
      <AdminNavbar />
      <div className="container py-5">
        <h4 className="text-center fw-bold mb-4" style={{ color: '#b22222' }}>JOB VACANCIES</h4>
        
        <div className="row justify-content-center mb-5 g-3">
            {/* DEPARTMENT FILTER - DYNAMIC MAPPING */}
            <div className="col-md-3 text-start">
                <label className="small fw-bold text-muted">DEPARTMENT</label>
                <select className="form-select shadow-sm" onChange={(e) => setFilters({...filters, department: e.target.value})}>
                    <option value="">All Departments</option>
                    {filterOptions.departments.map(dept => (
                        <option key={dept} value={dept}>{dept}</option>
                    ))}
                </select>
            </div>

            {/* JOB TYPE FILTER - DYNAMIC MAPPING */}
            <div className="col-md-3 text-start">
                <label className="small fw-bold text-muted">JOB TYPE</label>
                <select className="form-select shadow-sm" onChange={(e) => setFilters({...filters, jobType: e.target.value})}>
                    <option value="">All Types</option>
                    {filterOptions.jobTypes.map(type => (
                        <option key={type} value={type}>{type}</option>
                    ))}
                </select>
            </div>

            <div className="col-md-3 text-start">
                <label className="small fw-bold text-muted">POSTING DATE</label>
                <input 
                    type="date" 
                    className="form-control shadow-sm" 
                    onChange={(e) => {
                        const val = e.target.value;
                        const year = val.split("-")[0];
                        if (year.length <= 4) {
                            setFilters({...filters, date: val});
                        }
                    }} 
                />
            </div>
        </div>

        <div className="d-flex justify-content-between align-items-center mb-4">
          <h5 className="fw-bold mb-0">AVAILABLE POST'S</h5>
          <button className="btn btn-danger rounded-pill px-4 fw-bold shadow-sm" onClick={() => navigate('/admin/create-job')}>CREATE JOB</button>
        </div>

        <div className="border rounded p-3 shadow-sm bg-white">
          {filteredJobs.length > 0 ? (
            filteredJobs.map((job) => (
              <div key={job.id} className="d-flex justify-content-between align-items-center border-bottom py-4">
                <div className="text-start" style={{ width: '75%' }}>
                  <h6 className="fw-bold mb-1" style={{ color: '#b22222' }}>
                    {job.title} 
                    <span className="text-danger fw-normal small ms-2">
                        ({job.date && job.date.includes("-") ? formatDateForDisplay(job.date) : job.date})
                    </span>
                  </h6>
                  <p className="text-muted small mb-2 text-truncate">{job.description}</p>
                  <div className="d-flex gap-2">
                    {/* Tags-உம் டைனமிக்கா டிஸ்ப்ளே ஆகுது */}
                    <span className="badge bg-light text-dark border small">{job.dept}</span>
                    <span className="badge bg-light text-dark border small">{job.type}</span>
                  </div>
                </div>
                <button 
                  className="btn btn-outline-dark btn-sm rounded shadow-sm px-3 fw-bold"
                  onClick={() => navigate('/admin/job-details', { state: { job } })}
                >
                  View Detail's
                </button>
              </div>
            ))
          ) : (
            <div className="text-center py-5">
              <p className="text-muted mb-0">No jobs found matching your criteria.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default JobVacancyList;