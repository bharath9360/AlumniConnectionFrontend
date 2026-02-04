import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminNavbar from '../../components/admin/AdminNavbar';

const JobVacancyList = () => {
  const navigate = useNavigate();
  const [allJobs, setAllJobs] = useState([]);

  useEffect(() => {
    // Local Storage-ல் இருந்து டேட்டாவை எடுக்கிறோம்
    const savedJobs = JSON.parse(localStorage.getItem('adminJobs')) || [];
    
    // டம்மி டேட்டாவுடன் புதிய ஜாப்ஸையும் சேர்க்கிறோம்
    const dummyJobs = [
      { id: 101, title: 'Social Media Assistant', time: '2 days ago', description: 'Manage social media accounts.' },
    ];
    
    setAllJobs([...savedJobs, ...dummyJobs]);
  }, []);

  return (
    <div style={{ backgroundColor: '#fff', minHeight: '100vh' }}>
      <AdminNavbar />
      <div className="container py-5">
        <h4 className="text-center fw-bold mb-5" style={{ color: '#b22222' }}>JOB VACANCIES</h4>
        
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h5 className="fw-bold mb-0">JOB VACANCY POST'S</h5>
          <button className="btn btn-danger rounded-pill px-4 fw-bold shadow" onClick={() => navigate('/admin/create-job')}>CREATE JOB</button>
        </div>

        <div className="border rounded p-3 shadow-sm bg-white">
          {allJobs.map((job) => (
            <div key={job.id} className="d-flex justify-content-between align-items-center border-bottom py-4">
              <div style={{ width: '80%' }}>
                <h6 className="fw-bold mb-1" style={{ color: '#b22222' }}>
                  {job.title} <span className="text-danger fw-normal small ms-2">( {job.time || job.date} )</span>
                </h6>
                <p className="text-muted small mb-0">{job.description}</p>
              </div>
              <button className="btn btn-outline-dark btn-sm rounded shadow-sm px-3">View Detail's</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default JobVacancyList;