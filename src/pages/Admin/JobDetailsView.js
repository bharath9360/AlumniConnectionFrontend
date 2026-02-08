import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import AdminNavbar from '../../components/admin/AdminNavbar';

const JobDetailsView = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const job = location.state?.job;

    if (!job) {
        return <div className="text-center py-5"><h4>No Job Details Found</h4></div>;
    }

    // --- DELETE FUNCTION ---
    const handleDelete = () => {
        if (window.confirm("Are you sure you want to delete this job?")) {
            // LocalStorage-ல் இருந்து பழைய டேட்டாவை எடுக்கிறோம்
            const savedJobs = JSON.parse(localStorage.getItem('adminJobs')) || [];
            
            // இந்த குறிப்பிட்ட ஜாப்-ஐ மட்டும் லிஸ்ட்ல இருந்து நீக்குகிறோம் (Filter)
            const updatedJobs = savedJobs.filter(item => item.id !== job.id);
            
            // புது லிஸ்ட்டை சேவ் பண்ணிட்டு லிஸ்ட் பேஜுக்கு போறோம்
            localStorage.setItem('adminJobs', JSON.stringify(updatedJobs));
            alert("Job Deleted Successfully!");
            navigate('/admin/job-vacancies');
        }
    };

    // --- EDIT FUNCTION ---
    const handleEdit = () => {
        // எடிட் பண்ணும்போது அந்த டேட்டாவோட 'Create Job' பேஜுக்கு அனுப்புறோம்
        navigate('/admin/create-job', { state: { editJob: job } });
    };

    return (
        <div style={{ backgroundColor: '#fff', minHeight: '100vh' }}>
            <AdminNavbar />
            <div className="container py-5">
                <button className="btn btn-link text-decoration-none text-dark fw-bold mb-4" onClick={() => navigate(-1)}>
                    <i className="fas fa-arrow-left me-2"></i> BACK TO VACANCIES
                </button>

                <div className="row justify-content-center">
                    <div className="col-md-8">
                        <div className="card shadow-sm border-0 p-5 rounded-4 bg-white">
                            <h3 className="fw-bold mb-1" style={{ color: '#b22222' }}>{job.title}</h3>
                            <p className="text-muted fw-bold small">Posted: {job.time || job.date}</p>
                            <hr />
                            <div className="mt-4">
                                <h6 className="fw-bold text-dark mb-3">JOB DESCRIPTION</h6>
                                <p className="text-muted lh-lg">{job.description}</p>
                            </div>

                            {/* Actions Buttons */}
                            <div className="mt-5 d-flex justify-content-end gap-3">
                                <button className="btn btn-outline-danger px-4 fw-bold" onClick={handleDelete}>DELETE POST</button>
                                <button className="btn btn-danger px-4 fw-bold" onClick={handleEdit}>EDIT DETAILS</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default JobDetailsView;