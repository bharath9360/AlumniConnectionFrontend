import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminNavbar from '../../components/admin/AdminNavbar';

const AddAlumni = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: '', email: '', dept: 'CSE', batch: '', role: '', company: '', status: 'Verified'
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        const existingData = JSON.parse(localStorage.getItem('alumniData')) || [];
        const newData = { ...formData, id: Date.now() }; // Unique ID-க்காக
        
        const updatedList = [...existingData, newData];
        localStorage.setItem('alumniData', JSON.stringify(updatedList));
        
        alert("Alumni Added Successfully!");
        navigate('/admin/alumni'); // லிஸ்ட் பக்கத்திற்கு திரும்ப செல்ல
    };

    return (
        <div style={{ backgroundColor: '#fff', minHeight: '100vh' }}>
            <AdminNavbar />
            <div className="container py-5">
                <div className="card shadow-sm mx-auto p-4" style={{ maxWidth: '600px' }}>
                    <h4 className="fw-bold text-danger mb-4">Add New Alumni</h4>
                    <form onSubmit={handleSubmit}>
                        <div className="mb-3">
                            <label className="form-label small fw-bold">Full Name</label>
                            <input type="text" className="form-control" required onChange={(e) => setFormData({...formData, name: e.target.value})} />
                        </div>
                        <div className="mb-3">
                            <label className="form-label small fw-bold">Email</label>
                            <input type="email" className="form-control" required onChange={(e) => setFormData({...formData, email: e.target.value})} />
                        </div>
                        <div className="row">
                            <div className="col-md-6 mb-3">
                                <label className="form-label small fw-bold">Department</label>
                                <select className="form-select" onChange={(e) => setFormData({...formData, dept: e.target.value})}>
                                    <option>CSE</option><option>IT</option><option>ECE</option><option>EEE</option><option>MECH</option><option>CIVIL</option>
                                </select>
                            </div>
                            <div className="col-md-6 mb-3">
                                <label className="form-label small fw-bold">Batch</label>
                                <input type="number" className="form-control" placeholder="2024" required onChange={(e) => setFormData({...formData, batch: e.target.value})} />
                            </div>
                        </div>
                        <div className="mb-3">
                            <label className="form-label small fw-bold">Current Role</label>
                            <input type="text" className="form-control" placeholder="e.g. Software Engineer" onChange={(e) => setFormData({...formData, role: e.target.value})} />
                        </div>
                        <div className="mb-4">
                            <label className="form-label small fw-bold">Company Name</label>
                            <input type="text" className="form-control" onChange={(e) => setFormData({...formData, company: e.target.value})} />
                        </div>
                        <div className="d-flex gap-2">
                            <button type="submit" className="btn btn-danger w-100 fw-bold">SAVE ALUMNI</button>
                            <button type="button" className="btn btn-outline-secondary w-100 fw-bold" onClick={() => navigate(-1)}>CANCEL</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default AddAlumni;