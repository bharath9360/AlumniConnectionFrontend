import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import AdminNavbar from '../../components/admin/AdminNavbar';

const ViewProfile = () => {
    const { state } = useLocation();
    const navigate = useNavigate();
    const alumni = state?.alumni;

    const [isChatOpen, setIsChatOpen] = useState(false);
    const [msgInput, setMsgInput] = useState("");
    const [messages, setMessages] = useState([
        { id: 1, text: `Hi, I am ${alumni?.name}. Glad to connect with you!`, sender: 'alumni', time: '10:00 AM' }
    ]);

    const chatEndRef = useRef(null);
    const scrollToBottom = () => chatEndRef.current?.scrollIntoView({ behavior: "smooth" });

    useEffect(() => {
        if (isChatOpen) scrollToBottom();
    }, [messages, isChatOpen]);

    const handleSend = (e) => {
        e.preventDefault();
        if (msgInput.trim() === "") return;
        const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        setMessages([...messages, { id: messages.length + 1, text: msgInput, sender: 'admin', time: currentTime }]);
        setMsgInput("");
    };

    if (!alumni) return <div className="text-center mt-5"><h4>No Profile Data!</h4></div>;

    return (
        <div style={{ backgroundColor: '#f0f2f5', minHeight: '100vh', paddingBottom: '40px' }}>
            <AdminNavbar />
            
            <div className="container py-4">
                {/* Header Navigation */}
                <div className="d-flex align-items-center mb-4">
                    <button className="btn btn-dark rounded-pill px-4 shadow-sm fw-bold me-3" onClick={() => navigate(-1)}>
                        <i className="fas fa-arrow-left me-2"></i> BACK
                    </button>
                    <h5 className="mb-0 fw-bold text-muted">Admin / Alumni Profile</h5>
                </div>

                {/* Top Profile Summary Card */}
                <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: '20px' }}>
                    <div className="card-body p-4 text-center">
                        <div className="position-relative d-inline-block mb-3">
                            <img src="https://via.placeholder.com/120" className="rounded-circle border border-4 border-white shadow" alt="profile" style={{ width: '130px', height: '130px' }} />
                            <span className="position-absolute bottom-0 end-0 bg-success border border-white rounded-circle p-2 shadow-sm" style={{ width: '15px', height: '15px' }}></span>
                        </div>
                        <h3 className="fw-bold mb-1">{alumni.name}</h3>
                        <p className="text-muted mb-2">Hi, I am {alumni.name}. Glad to connect with you!</p>
                        <div className="d-flex justify-content-center gap-2">
                            <span className="badge bg-danger-subtle text-danger px-3 py-2 rounded-pill border border-danger">Verified</span>
                            <span className="badge bg-primary-subtle text-primary px-3 py-2 rounded-pill border border-primary">{alumni.dept} Dept</span>
                        </div>
                    </div>
                </div>

                {/* Information Grid */}
                <div className="row g-4">
                    {/* Contact Information */}
                    <div className="col-md-4">
                        <div className="card border-0 shadow-sm h-100 p-3" style={{ borderRadius: '15px' }}>
                            <h6 className="fw-bold text-danger mb-3"><i className="fas fa-info-circle me-2"></i> Contact Information</h6>
                            <p className="small mb-2"><strong>Email:</strong> <br/> {alumni.email}</p>
                            <p className="small mb-2"><strong>Phone:</strong> <br/> +91 98765 43210</p>
                            <p className="small mb-0"><strong>Location:</strong> <br/> Chennai, TN, India</p>
                        </div>
                    </div>

                    {/* Academic Details */}
                    <div className="col-md-4">
                        <div className="card border-0 shadow-sm h-100 p-3" style={{ borderRadius: '15px' }}>
                            <h6 className="fw-bold text-danger mb-3"><i className="fas fa-graduation-cap me-2"></i> Academic Details</h6>
                            <p className="small mb-2"><strong>Institution:</strong> <br/> MAMCET</p>
                            <p className="small mb-2"><strong>Batch:</strong> <br/> {alumni.batch} Passed Out</p>
                            <p className="small mb-0"><strong>Degree:</strong> <br/> Bachelor of Engineering</p>
                        </div>
                    </div>

                    {/* Professional Career */}
                    <div className="col-md-4">
                        <div className="card border-0 shadow-sm h-100 p-3" style={{ borderRadius: '15px' }}>
                            <h6 className="fw-bold text-danger mb-3"><i className="fas fa-briefcase me-2"></i> Professional Career</h6>
                            <p className="small mb-2"><strong>Current Role:</strong> <br/> {alumni.role}</p>
                            <p className="small mb-2"><strong>Company:</strong> <br/> {alumni.company}</p>
                            <p className="small mb-0"><strong>Experience:</strong> <br/> 2+ Years</p>
                        </div>
                    </div>

                    {/* Skills Section */}
                    <div className="col-md-12">
                        <div className="card border-0 shadow-sm p-4" style={{ borderRadius: '15px' }}>
                            <h6 className="fw-bold text-danger mb-3"><i className="fas fa-lightbulb me-2"></i> Skills & Expertise</h6>
                            <div className="d-flex flex-wrap gap-2">
                                {['React.js', 'Node.js', 'UI/UX Design', 'Database Management', 'Cloud Computing'].map(skill => (
                                    <span key={skill} className="badge bg-light text-dark border p-2 px-3 rounded-pill shadow-sm">{skill}</span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Message Button */}
                <div className="mt-5 text-center">
                    <button className="btn btn-danger btn-lg rounded-pill px-5 fw-bold shadow" onClick={() => setIsChatOpen(true)}>
                        <i className="fas fa-comment-dots me-2"></i> MESSAGE ALUMNI
                    </button>
                </div>
            </div>

            {/* Chat Overlay UI */}
            {isChatOpen && (
                <div className="position-fixed bottom-0 end-0 m-4 shadow-lg border-0 bg-white chat-box" style={{ width: '380px', zIndex: 1060, borderRadius: '20px', overflow: 'hidden' }}>
                    <div className="p-3 bg-danger text-white d-flex justify-content-between align-items-center">
                        <h6 className="mb-0 fw-bold"><i className="fas fa-circle text-success small me-2"></i> Chat with {alumni.name}</h6>
                        <button className="btn-close btn-close-white" onClick={() => setIsChatOpen(false)}></button>
                    </div>

                    <div className="p-3 bg-light" style={{ height: '320px', overflowY: 'auto' }}>
                        {messages.map(m => (
                            <div key={m.id} className={`mb-3 d-flex flex-column ${m.sender === 'admin' ? 'align-items-end' : 'align-items-start'}`}>
                                <div className={`p-2 px-3 shadow-sm rounded-3 small ${m.sender === 'admin' ? 'bg-danger text-white' : 'bg-white text-dark'}`} style={{ maxWidth: '85%' }}>
                                    {m.text}
                                </div>
                                <span className="text-muted mt-1" style={{ fontSize: '10px' }}>{m.time}</span>
                            </div>
                        ))}
                        <div ref={chatEndRef} />
                    </div>

                    <form onSubmit={handleSend} className="p-3 border-top bg-white">
                        <div className="input-group">
                            <input 
                                type="text" 
                                className="form-control border-0 shadow-none bg-light" 
                                placeholder="Type your message..." 
                                value={msgInput}
                                onChange={(e) => setMsgInput(e.target.value)}
                                style={{ borderRadius: '20px 0 0 20px' }}
                            />
                            <button className="btn btn-danger px-4 fw-bold" type="submit" style={{ borderRadius: '0 20px 20px 0' }}>
                                SEND
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
};

export default ViewProfile;