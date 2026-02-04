import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminNavbar from '../../components/admin/AdminNavbar';

const CreateJob = () => {
    const navigate = useNavigate();
    
    // Application Links-க்காக ஸ்டேட்
    const [links, setLinks] = useState(['']);
    
    // ஜாப் டீடைல்ஸ்-க்காக ஸ்டேட்
    const [jobData, setJobData] = useState({
        title: '',
        description: '',
        location: '',
        date: ''
    });

    // புதிய லிங்க் பாக்ஸ் ஆட் பண்ண
    const addLinkField = () => {
        setLinks([...links, '']);
    };

    // லிங்க் பாக்ஸில் டைப் செய்வதை அப்டேட் பண்ண
    const handleLinkChange = (index, value) => {
        const newLinks = [...links];
        newLinks[index] = value;
        setLinks(newLinks);
    };

    const handlePostJob = () => {
        // LocalStorage சேமிப்பு முறை
        const existingJobs = JSON.parse(localStorage.getItem('adminJobs')) || [];
        const newJob = {
            ...jobData,
            id: Date.now(),
            time: 'Just now',
            appLinks: links // இங்கதான் அந்த லிங்க்ஸ் டேட்டா சேருது
        };
        
        localStorage.setItem('adminJobs', JSON.stringify([newJob, ...existingJobs]));
        alert("Job Posted Successfully!");
        navigate('/admin/job-vacancies'); 
    };

    return (
        <div style={{ backgroundColor: '#fff', minHeight: '100vh' }}>
            <AdminNavbar />
            <div className="container py-5">
                <h3 className="text-center fw-bold mb-5" style={{ color: '#b22222' }}>CREATE JOB OPPORTUNITIES</h3>
                
                <div className="row g-4 px-lg-5 justify-content-center">
                    <div className="col-md-5">
                        <label className="fw-bold small mb-2 text-uppercase">Job Title</label>
                        <input type="text" className="form-control bg-light border-0 p-3 shadow-sm" 
                            onChange={(e) => setJobData({...jobData, title: e.target.value})} 
                            placeholder="ENTER A JOB TITLE" />
                    </div>

                    <div className="col-md-5">
                        <label className="fw-bold small mb-2 text-uppercase">Date</label>
                        <input type="date" className="form-control bg-light border-0 p-3 shadow-sm" 
                            onChange={(e) => setJobData({...jobData, date: e.target.value})} />
                    </div>

                    <div className="col-md-5">
                        <label className="fw-bold small mb-2 text-uppercase">Job Description</label>
                        <textarea className="form-control bg-light border-0 p-3 shadow-sm" rows="5" 
                            onChange={(e) => setJobData({...jobData, description: e.target.value})} 
                            placeholder="ENTER A JOB DESCRIPTION"></textarea>
                    </div>

                    <div className="col-md-5">
                        <label className="fw-bold small mb-2 text-uppercase">Location</label>
                        <input type="text" className="form-control bg-light border-0 p-3 shadow-sm" 
                            onChange={(e) => setJobData({...jobData, location: e.target.value})} 
                            placeholder="ENTER A LOCATION" />
                    </div>

                    {/* Application Links செக்ஷன் - இப்போ இது ஒர்க் ஆகும் */}
                    <div className="col-md-10 mt-4">
                        <label className="fw-bold small mb-2 text-uppercase">Application Links</label>
                        {links.map((link, index) => (
                            <input 
                                key={index} 
                                type="text" 
                                className="form-control bg-light border-0 p-3 mb-2 shadow-sm" 
                                placeholder="PASTE JOB LINKS HERE"
                                value={link}
                                onChange={(e) => handleLinkChange(index, e.target.value)}
                            />
                        ))}
                        <button 
                            className="btn text-primary p-0 small fw-bold border-0 bg-transparent" 
                            onClick={addLinkField}
                            type="button"
                        >
                            + ADD MORE LINKS
                        </button>
                    </div>
                    
                    <div className="col-12 text-center mt-5">
                        <button className="btn text-muted fw-bold me-4 border-0 bg-transparent" onClick={() => navigate('/admin/job-vacancies')}>CANCEL</button>
                        <button className="btn btn-primary px-5 py-2 rounded-pill fw-bold shadow" onClick={handlePostJob}>POST JOB</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CreateJob;