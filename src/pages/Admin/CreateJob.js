import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import AdminNavbar from '../../components/admin/AdminNavbar';

const CreateJob = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const editJob = location.state?.editJob;

    // இன்றைய தேதியை எடுக்கும் முறை (YYYY-MM-DD)
    const today = new Date().toISOString().split('T')[0];

    const [jobData, setJobData] = useState({
        title: '',
        description: '',
        dept: '',
        type: '',
        date: today // Default-ஆக இன்றைய தேதி இருக்கும்
    });

    useEffect(() => {
        if (editJob) {
            setJobData(editJob);
        }
    }, [editJob]);

    // --- போஸ்ட் செய்யும் பங்க்ஷன் ---
    const handlePost = (e) => {
        e.preventDefault(); // பேஜ் ரீலோட் ஆவதைத் தவிர்க்க

        // வேலிடேஷன்: எல்லாம் ஃபில் ஆகிருக்கான்னு செக் பண்ணும்
        if (!jobData.title.trim() || !jobData.description.trim() || !jobData.dept || !jobData.type || !jobData.date) {
            alert("Please fill all the details! Empty posts are not allowed.");
            return;
        }

        const savedJobs = JSON.parse(localStorage.getItem('adminJobs')) || [];
        
        if (editJob) {
            // எடிட் பண்ணினால் பழைய ஐடியுடன் அப்டேட் செய்யும்
            const updated = savedJobs.map(j => j.id === editJob.id ? jobData : j);
            localStorage.setItem('adminJobs', JSON.stringify(updated));
            alert("Job Updated Successfully! ✅");
        } else {
            // புதுசு என்றால் புதிய ID உருவாக்கி சேவ் செய்யும்
            const newJob = { ...jobData, id: Date.now() };
            const newList = [...savedJobs, newJob];
            localStorage.setItem('adminJobs', JSON.stringify(newList));
            alert("Job Posted Successfully! 🚀");
        }
        
        // சேவ் ஆன பிறகு லிஸ்ட் பேஜுக்கு போகும்
        navigate('/admin/job-vacancies');
    };

    return (
        <div style={{ backgroundColor: '#fff', minHeight: '100vh' }}>
            <AdminNavbar />
            <div className="container py-5">
                <div className="row justify-content-center">
                    <div className="col-md-7 card p-5 shadow border-0" style={{ borderRadius: '20px' }}>
                        <h4 className="fw-bold mb-4 text-center" style={{ color: '#b22222', letterSpacing: '1px' }}>
                            {editJob ? "EDIT JOB VACANCY" : "CREATE NEW JOB POST"}
                        </h4>

                        <div className="mb-3">
                            <label className="small fw-bold text-muted mb-1">JOB TITLE</label>
                            <input 
                                type="text" 
                                className="form-control py-2" 
                                value={jobData.title} 
                                onChange={(e) => setJobData({...jobData, title: e.target.value})} 
                                placeholder="e.g. Frontend Developer" 
                            />
                        </div>

<div className="row mb-3 text-start">
    <div className="col-md-6">
        <label className="small fw-bold text-muted mb-1">DEPARTMENT</label>
        <select className="form-select" value={jobData.dept} onChange={(e) => setJobData({...jobData, dept: e.target.value})}>
            <option value="">Select Dept</option>
            <option value="CSE">CSE</option>
            <option value="ECE">ECE</option>
            <option value="IT">IT</option>
            <option value="MECH">MECH</option>
            <option value="CIVIL">CIVIL</option> {/* CIVIL சேர்க்கப்பட்டது */}
        </select>
    </div>
    <div className="col-md-6">
        <label className="small fw-bold text-muted mb-1">JOB TYPE</label>
        <select className="form-select" value={jobData.type} onChange={(e) => setJobData({...jobData, type: e.target.value})}>
            <option value="">Select Type</option>
            <option value="Full Time">Full Time</option>
            <option value="Part Time">Part Time</option> {/* Part Time சேர்க்கப்பட்டது */}
            <option value="Remote">Remote</option>
            <option value="Internship">Internship</option>
        </select>
    </div>
</div>

                           

                        <div className="mb-3 text-start">
                            <label className="small fw-bold text-muted mb-1">POSTING DATE (Manual Selection)</label>
                            <input 
                                type="date" 
                                className="form-control" 
                                value={jobData.date} 
                                onChange={(e) => {
                                    const val = e.target.value;
                                    const year = val.split("-")[0];
                                    if (year.length <= 4) {
                                        setJobData({...jobData, date: val});
                                    }
                                }} 
                            />
                        </div>

                        <div className="mb-4 text-start">
                            <label className="small fw-bold text-muted mb-1">JOB DESCRIPTION</label>
                            <textarea 
                                className="form-control" 
                                rows="5" 
                                value={jobData.description} 
                                onChange={(e) => setJobData({...jobData, description: e.target.value})} 
                                placeholder="Describe the job requirements..."
                            ></textarea>
                        </div>

                        <div className="d-flex gap-3">
                            <button className="btn btn-outline-dark w-100 fw-bold py-2 rounded-pill" onClick={() => navigate(-1)}>CANCEL</button>
                            <button className="btn btn-danger w-100 fw-bold py-2 rounded-pill shadow" onClick={handlePost}>
                                {editJob ? "UPDATE POST" : "POST JOB"}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CreateJob;