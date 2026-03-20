import React, { useState, useEffect } from 'react';
import { storage } from '../../utils/storage';
import { useAuth } from '../../context/AuthContext';
import Modal from '../../components/common/Modal';
import Toast from '../../components/common/Toast';

const UserProfile = ({ isHome }) => {
    const { user: authUser, userRole } = useAuth();
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState(null);

    // Modal states
    const [isEditHeaderOpen, setIsEditHeaderOpen] = useState(false);
    const [isEditAboutOpen, setIsEditAboutOpen] = useState(false);
    const [isEditExpOpen, setIsEditExpOpen] = useState(false);
    const [isEditEduOpen, setIsEditEduOpen] = useState(false);
    const [isEditSkillsOpen, setIsEditSkillsOpen] = useState(false);
    const [skillsInput, setSkillsInput] = useState("");

    // Form states
    const [editData, setEditData] = useState({});

    useEffect(() => {
        let user = storage.getCurrentUser();
        // Fallback to auth context if storage is empty
        if (!user && authUser) {
            user = authUser;
        }
        if (user) {
            setUserData(user);
            setEditData(user);
        }
        setLoading(false);
    }, [authUser]);

    const handleSave = (modalSetter) => {
        storage.updateCurrentUser(editData);
        setUserData(editData);
        modalSetter(false);
        showToast("Profile updated successfully!", "success");
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setEditData({ ...editData, [name]: value });
    };

    const handleArrayChange = (arrayName, index, field, value) => {
        setEditData(prev => {
            const newArray = [...(prev[arrayName] || [])];
            newArray[index] = { ...newArray[index], [field]: value };
            return { ...prev, [arrayName]: newArray };
        });
    };

    const addArrayItem = (arrayName, defaultItem, modalSetter) => {
        setEditData(prev => ({
            ...prev,
            [arrayName]: [...(prev[arrayName] || []), { ...defaultItem, id: Date.now() }]
        }));
        modalSetter(true);
    };

    const removeArrayItem = (arrayName, index) => {
        setEditData(prev => {
            const newArray = [...(prev[arrayName] || [])];
            newArray.splice(index, 1);
            return { ...prev, [arrayName]: newArray };
        });
    };

    const showToast = (message, type) => {
        setToast({ message, type });
    };

    if (loading) return <div className="p-5 text-center">Loading Profile...</div>;

    if (!userData) return (
        <div className="p-5 text-center min-vh-100 d-flex flex-column align-items-center justify-content-center">
            <h4>No Profile Data Found</h4>
            <p className="text-muted">Please login to view your profile.</p>
            <a href="/login" className="btn btn-mamcet-red px-4 mt-2">Go to Login</a>
        </div>
    );

    const isStudent = userRole === 'student';

    if (isHome && userRole === 'admin') {
        return (
            <div style={{ backgroundColor: '#fff', minHeight: '100vh' }}>
                <div className="container mt-4">
                    <div className="text-center">
                        <h1 className="fw-bold" style={{ color: '#b22222', fontSize: '2.5rem', marginBottom: '10px' }}>
                            WELCOME HOME
                        </h1>
                        <div style={{ height: '2px', width: '50px', backgroundColor: '#b22222', margin: '0 auto 15px' }}></div>
                        <p className="text-muted fw-bold" style={{ letterSpacing: '1px', fontSize: '14px' }}>
                            ADMIN PANEL ACTIVE
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="dashboard-main-bg py-4 min-vh-100">
            <div className="container">
                <div className="row justify-content-center">
                    <div className="col-lg-9">

                        {/* LINKEDIN STYLE HEADER */}
                        <div className="dashboard-card bg-white shadow-sm overflow-hidden mb-4 rounded-3 border-0">
                            <div className="profile-cover-wrapper position-relative" style={{ height: '200px' }}>
                                <img
                                    src={userData.coverPic || "https://via.placeholder.com/1200x400"}
                                    alt="Cover"
                                    className="w-100 h-100 object-fit-cover"
                                />
                                <button
                                    className="btn btn-light btn-sm position-absolute top-0 end-0 m-3 shadow-sm rounded-circle"
                                    onClick={() => setIsEditHeaderOpen(true)}
                                >
                                    <i className="fas fa-pencil-alt text-mamcet-red"></i>
                                </button>
                            </div>

                            <div className="px-4 pb-4 position-relative">
                                <div className="profile-avatar-pro shadow" style={{
                                    marginTop: '-100px',
                                    width: '160px',
                                    height: '160px',
                                    borderRadius: '50%',
                                    border: '4px solid white',
                                    backgroundColor: '#f8f9fa',
                                    overflow: 'hidden',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '4rem',
                                    fontWeight: 'bold',
                                    color: '#c84022'
                                }}>
                                    {userData.profilePic ? (
                                        <img src={userData.profilePic} alt="Profile" className="w-100 h-100 object-fit-cover" />
                                    ) : (userData.name?.[0] || "?")}
                                </div>

                                <div className="mt-3 d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3">
                                    <div className="mobile-text-center w-100 w-md-auto">
                                        <h2 className="fw-bold mb-0 text-dark">{userData.name}</h2>
                                        <p className="lead fs-6 text-muted mb-2">
                                            {userData.role} {userData.company ? `at ${userData.company}` : ''}
                                        </p>
                                        <div className="d-flex flex-wrap align-items-center gap-3 text-muted extra-small">
                                            <span>{userData.batch} Batch</span>
                                            <span>&bull;</span>
                                            <span className="text-mamcet-red fw-bold">{userData.connections} connections</span>
                                            <span className="d-none d-md-inline">&bull;</span>
                                            <span className="d-none d-md-inline">{userData.views} profile views</span>
                                        </div>
                                    </div>
                                    <div className="d-flex flex-wrap gap-2 w-100 w-md-auto justify-content-md-end">
                                        <button className="btn btn-pro btn-pro-primary flex-grow-1 flex-md-grow-0">
                                            {isStudent ? 'Looking for Internships' : 'Open to Work'}
                                        </button>
                                        <button className="btn btn-pro btn-pro-outline flex-grow-1 flex-md-grow-0">Add section</button>
                                        <button
                                            className="btn btn-pro btn-pro-ghost-red rounded-circle border shadow-sm d-none d-md-flex"
                                            onClick={() => setIsEditHeaderOpen(true)}
                                        >
                                            <i className="fas fa-pencil-alt"></i>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ABOUT SECTION */}
                        <div className="dashboard-card bg-white shadow-sm p-4 mb-4 rounded-3 border-0">
                            <div className="d-flex justify-content-between align-items-center mb-3">
                                <h5 className="fw-bold mb-0 text-dark">About</h5>
                                <button className="btn btn-link text-decoration-none p-0" onClick={() => setIsEditAboutOpen(true)}>
                                    <i className="fas fa-pencil-alt text-mamcet-red"></i>
                                </button>
                            </div>
                            <p className="text-muted mb-0">{userData.bio}</p>
                        </div>

                        {/* EXPERIENCE SECTION - Rebranded to 'Projects' for Student potentially */}
                        <div className="dashboard-card bg-white shadow-sm p-4 mb-4 rounded-3 border-0">
                            <div className="d-flex justify-content-between align-items-center mb-4">
                                <h5 className="fw-bold mb-0 text-dark">{isStudent ? 'Experience / Projects' : 'Experience'}</h5>
                                <div className="d-flex gap-3">
                                    <button className="btn btn-link text-decoration-none p-0 btn-pro btn-pro-ghost-red" onClick={() => addArrayItem('experience', { title: '', company: '', duration: '', desc: '' }, setIsEditExpOpen)}>
                                        <i className="fas fa-plus"></i>
                                    </button>
                                    <button className="btn btn-link text-decoration-none p-0 btn-pro btn-pro-ghost-red" onClick={() => setIsEditExpOpen(true)}>
                                        <i className="fas fa-pencil-alt"></i>
                                    </button>
                                </div>
                            </div>
                            {userData.experience?.map((exp, idx) => (
                                <div key={exp.id} className={`d-flex gap-3 ${idx !== userData.experience.length - 1 ? 'mb-4 border-bottom pb-4' : ''}`}>
                                    <div className="bg-light rounded p-3 d-flex align-items-center justify-content-center" style={{ width: '56px', height: '56px' }}>
                                        <i className="fas fa-briefcase text-secondary fs-4"></i>
                                    </div>
                                    <div>
                                        <h6 className="fw-bold mb-0">{exp.title}</h6>
                                        <p className="small text-dark mb-1">{exp.company}</p>
                                        <p className="extra-small text-muted mb-2">{exp.duration}</p>
                                        <p className="small text-muted mb-0">{exp.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* EDUCATION SECTION */}
                        <div className="dashboard-card bg-white shadow-sm p-4 mb-4 rounded-3 border-0">
                            <div className="d-flex justify-content-between align-items-center mb-4">
                                <h5 className="fw-bold mb-0 text-dark">Education</h5>
                                <div className="d-flex gap-3">
                                    <button className="btn btn-link text-decoration-none p-0" onClick={() => addArrayItem('education', { school: '', degree: '', duration: '' }, setIsEditEduOpen)}>
                                        <i className="fas fa-plus text-mamcet-red"></i>
                                    </button>
                                    <button className="btn btn-link text-decoration-none p-0" onClick={() => setIsEditEduOpen(true)}>
                                        <i className="fas fa-pencil-alt text-mamcet-red"></i>
                                    </button>
                                </div>
                            </div>
                            {userData.education?.map((edu, idx) => (
                                <div key={edu.id} className="d-flex gap-3">
                                    <div className="bg-light rounded p-3 d-flex align-items-center justify-content-center" style={{ width: '56px', height: '56px' }}>
                                        <i className="fas fa-university text-secondary fs-4"></i>
                                    </div>
                                    <div>
                                        <h6 className="fw-bold mb-0">{edu.school}</h6>
                                        <p className="small text-dark mb-1">{edu.degree}</p>
                                        <p className="extra-small text-muted mb-0">{edu.duration}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* SKILLS SECTION */}
                        <div className="dashboard-card bg-white shadow-sm p-4 mb-4 rounded-3 border-0">
                            <div className="d-flex justify-content-between align-items-center mb-4">
                                <h5 className="fw-bold mb-0 text-dark">Skills</h5>
                                <div className="d-flex gap-3">
                                    <button className="btn btn-link text-decoration-none p-0" onClick={() => { setIsEditSkillsOpen(true); setSkillsInput((userData.skills || []).join(', ')); }}>
                                        <i className="fas fa-pencil-alt text-mamcet-red"></i>
                                    </button>
                                </div>
                            </div>
                            <div className="d-flex flex-wrap gap-2">
                                {userData.skills?.map((skill, idx) => (
                                    <span key={idx} className="badge bg-light text-dark border p-2 px-3 rounded-pill fw-normal">
                                        {skill}
                                    </span>
                                ))}
                            </div>
                        </div>

                    </div>
                </div>
            </div>

            {/* MODALS */}
            <Modal
                isOpen={isEditHeaderOpen}
                onClose={() => setIsEditHeaderOpen(false)}
                title="Edit Intro"
                footer={<button className="btn btn-mamcet-red" onClick={() => handleSave(setIsEditHeaderOpen)}>Save Changes</button>}
            >
                <div className="row g-3">
                    <div className="col-12">
                        <label className="form-label extra-small fw-bold">Full Name</label>
                        <input type="text" className="form-control" name="name" value={editData.name || ""} onChange={handleChange} />
                    </div>
                    <div className="col-12">
                        <label className="form-label extra-small fw-bold">Headline (Role/Title)</label>
                        <input type="text" className="form-control" name="role" value={editData.role || ""} onChange={handleChange} />
                    </div>
                    {!isStudent && (
                        <div className="col-12">
                            <label className="form-label extra-small fw-bold">Current Company</label>
                            <input type="text" className="form-control" name="company" value={editData.company || ""} onChange={handleChange} />
                        </div>
                    )}
                    <div className="col-6">
                        <label className="form-label extra-small fw-bold">Profile Picture URL</label>
                        <input type="text" className="form-control" name="profilePic" value={editData.profilePic || ""} onChange={handleChange} />
                    </div>
                    <div className="col-6">
                        <label className="form-label extra-small fw-bold">Cover Photo URL</label>
                        <input type="text" className="form-control" name="coverPic" value={editData.coverPic || ""} onChange={handleChange} />
                    </div>
                </div>
            </Modal>

            <Modal
                isOpen={isEditAboutOpen}
                onClose={() => setIsEditAboutOpen(false)}
                title="Edit About"
                footer={<button className="btn btn-mamcet-red" onClick={() => handleSave(setIsEditAboutOpen)}>Save Changes</button>}
            >
                <div className="col-12">
                    <label className="form-label extra-small fw-bold">Summary</label>
                    <textarea className="form-control" name="bio" rows="6" value={editData.bio || ""} onChange={handleChange}></textarea>
                </div>
            </Modal>

            <Modal
                isOpen={isEditExpOpen}
                onClose={() => setIsEditExpOpen(false)}
                title={isStudent ? "Edit Experience / Projects" : "Edit Experience"}
                footer={<button className="btn btn-mamcet-red" onClick={() => handleSave(setIsEditExpOpen)}>Save Changes</button>}
            >
                <div className="d-flex flex-column gap-3">
                    {(editData.experience || []).map((exp, idx) => (
                        <div key={exp.id || idx} className="border p-3 rounded position-relative">
                            <button className="btn btn-sm text-danger position-absolute top-0 end-0 m-2" onClick={() => removeArrayItem('experience', idx)}>
                                <i className="fas fa-trash"></i>
                            </button>
                            <div className="row g-2 mt-2">
                                <div className="col-md-6">
                                    <label className="form-label extra-small fw-bold">Title/Role</label>
                                    <input type="text" className="form-control form-control-sm" value={exp.title || ''} onChange={e => handleArrayChange('experience', idx, 'title', e.target.value)} />
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label extra-small fw-bold">{isStudent ? 'Company/Organization' : 'Company'}</label>
                                    <input type="text" className="form-control form-control-sm" value={exp.company || ''} onChange={e => handleArrayChange('experience', idx, 'company', e.target.value)} />
                                </div>
                                <div className="col-12">
                                    <label className="form-label extra-small fw-bold">Duration</label>
                                    <input type="text" className="form-control form-control-sm" value={exp.duration || ''} onChange={e => handleArrayChange('experience', idx, 'duration', e.target.value)} />
                                </div>
                                <div className="col-12">
                                    <label className="form-label extra-small fw-bold">Description</label>
                                    <textarea className="form-control form-control-sm" rows="2" value={exp.desc || ''} onChange={e => handleArrayChange('experience', idx, 'desc', e.target.value)}></textarea>
                                </div>
                            </div>
                        </div>
                    ))}
                    <button className="btn btn-outline-secondary btn-sm" onClick={() => addArrayItem('experience', { title: '', company: '', duration: '', desc: '' }, () => { })}>
                        <i className="fas fa-plus me-1"></i> Add new role
                    </button>
                </div>
            </Modal>

            <Modal
                isOpen={isEditEduOpen}
                onClose={() => setIsEditEduOpen(false)}
                title="Edit Education"
                footer={<button className="btn btn-mamcet-red" onClick={() => handleSave(setIsEditEduOpen)}>Save Changes</button>}
            >
                <div className="d-flex flex-column gap-3">
                    {(editData.education || []).map((edu, idx) => (
                        <div key={edu.id || idx} className="border p-3 rounded position-relative">
                            <button className="btn btn-sm text-danger position-absolute top-0 end-0 m-2" onClick={() => removeArrayItem('education', idx)}>
                                <i className="fas fa-trash"></i>
                            </button>
                            <div className="row g-2 mt-2">
                                <div className="col-12">
                                    <label className="form-label extra-small fw-bold">School/University</label>
                                    <input type="text" className="form-control form-control-sm" value={edu.school || ''} onChange={e => handleArrayChange('education', idx, 'school', e.target.value)} />
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label extra-small fw-bold">Degree</label>
                                    <input type="text" className="form-control form-control-sm" value={edu.degree || ''} onChange={e => handleArrayChange('education', idx, 'degree', e.target.value)} />
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label extra-small fw-bold">Duration</label>
                                    <input type="text" className="form-control form-control-sm" value={edu.duration || ''} onChange={e => handleArrayChange('education', idx, 'duration', e.target.value)} />
                                </div>
                            </div>
                        </div>
                    ))}
                    <button className="btn btn-outline-secondary btn-sm" onClick={() => addArrayItem('education', { school: '', degree: '', duration: '' }, () => { })}>
                        <i className="fas fa-plus me-1"></i> Add new school
                    </button>
                </div>
            </Modal>

            <Modal
                isOpen={isEditSkillsOpen}
                onClose={() => setIsEditSkillsOpen(false)}
                title="Edit Skills"
                footer={<button className="btn btn-mamcet-red" onClick={() => {
                    const parsedSkills = skillsInput.split(',').map(s => s.trim()).filter(s => s);
                    setEditData(prev => ({ ...prev, skills: parsedSkills }));
                    setTimeout(() => handleSave(setIsEditSkillsOpen), 50);
                }}>Save Changes</button>}
            >
                <div className="col-12">
                    <label className="form-label extra-small fw-bold">Skills (Comma-separated)</label>
                    <input
                        type="text"
                        className="form-control"
                        value={skillsInput}
                        onChange={(e) => setSkillsInput(e.target.value)}
                        placeholder="e.g. React, Node.js, Python"
                    />
                    <div className="d-flex flex-wrap gap-2 mt-3">
                        {skillsInput.split(',').map(s => s.trim()).filter(s => s).map((skill, idx) => (
                            <span key={idx} className="badge bg-light text-dark border p-2 px-3 rounded-pill fw-semibold">
                                {skill}
                            </span>
                        ))}
                    </div>
                </div>
            </Modal>

            {/* TOAST NOTIFICATION */}
            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}
        </div>
    );
};

export default UserProfile;
