import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminNavbar from '../../components/admin/AdminNavbar';

const CreateEvent = () => {
    const navigate = useNavigate();
    const [links, setLinks] = useState(['']);
    const [eventData, setEventData] = useState({
        title: '',
        description: '',
        location: '',
        date: ''
    });

    const addLinkField = () => setLinks([...links, '']);

    const handleLinkChange = (index, value) => {
        const newLinks = [...links];
        newLinks[index] = value;
        setLinks(newLinks);
    };

    const handlePostEvent = () => {
        // --- Validation Check Starts ---
        if (!eventData.title.trim() || !eventData.date || !eventData.description.trim() || !eventData.location.trim()) {
            alert("Please fill in all the required fields (Title, Date, Description, and Location)!");
            return; // காலியாக இருந்தால் இங்கேயே நின்றுவிடும்
        }
        // --- Validation Check Ends ---

        const existingEvents = JSON.parse(localStorage.getItem('adminEvents')) || [];
        
        // லிங்க் காலியாக இருந்தால் அதை நீக்கிவிட (Clean up empty links)
        const filteredLinks = links.filter(link => link.trim() !== "");

        const newEvent = {
            ...eventData,
            id: Date.now(),
            type: 'Upcoming Event',
            regLinks: filteredLinks
        };
        
        localStorage.setItem('adminEvents', JSON.stringify([newEvent, ...existingEvents]));
        alert("Event Posted Successfully!");
        navigate('/admin/upcoming-events-list'); 
    };

    return (
        <div style={{ backgroundColor: '#fff', minHeight: '100vh' }}>
            <AdminNavbar />
            <div className="container py-5">
                <h4 className="text-center fw-bold mb-5" style={{ color: '#b22222' }}>CREATE UPCOMING EVENT'S</h4>
                
                <div className="row g-4 px-lg-5 justify-content-center">
                    <div className="col-md-5">
                        <label className="fw-bold small mb-2">EVENT TITLE <span className="text-danger">*</span></label>
                        <input type="text" className="form-control bg-light border-0 p-3 shadow-sm" 
                            onChange={(e) => setEventData({...eventData, title: e.target.value})} placeholder="ENTER EVENT TITLE" />
                    </div>
                    <div className="col-md-5">
                        <label className="fw-bold small mb-2">DATE <span className="text-danger">*</span></label>
                        <input type="date" className="form-control bg-light border-0 p-3 shadow-sm" 
                            onChange={(e) => setEventData({...eventData, date: e.target.value})} />
                    </div>
                    <div className="col-md-5">
                        <label className="fw-bold small mb-2">DESCRIPTION <span className="text-danger">*</span></label>
                        <textarea className="form-control bg-light border-0 p-3 shadow-sm" rows="4" 
                            onChange={(e) => setEventData({...eventData, description: e.target.value})} placeholder="ENTER DESCRIPTION"></textarea>
                    </div>
                    <div className="col-md-5">
                        <label className="fw-bold small mb-2">LOCATION <span className="text-danger">*</span></label>
                        <input type="text" className="form-control bg-light border-0 p-3 shadow-sm" 
                            onChange={(e) => setEventData({...eventData, location: e.target.value})} placeholder="ENTER LOCATION" />
                    </div>
                    <div className="col-md-10">
                        <label className="fw-bold small mb-2">REGISTRATION LINKS</label>
                        {links.map((link, index) => (
                            <input key={index} type="text" className="form-control bg-light border-0 p-3 mb-2 shadow-sm" 
                                value={link} onChange={(e) => handleLinkChange(index, e.target.value)} placeholder="PASTE LINKS" />
                        ))}
                        <button className="btn text-primary p-0 small fw-bold border-0 bg-transparent" onClick={addLinkField}>+ ADD</button>
                    </div>
                    
                    <div className="col-12 text-center mt-5">
                        <button className="btn text-muted fw-bold me-4 border-0 bg-transparent" onClick={() => navigate('/admin/upcoming-events-list')}>CANCEL</button>
                        <button className="btn btn-primary px-5 py-2 rounded-pill fw-bold shadow" onClick={handlePostEvent}>POST EVENT</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CreateEvent;