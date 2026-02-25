import React, { useState, useEffect } from 'react';
import { storage } from '../../utils/storage';
import Modal from '../../components/common/Modal';
import Toast from '../../components/common/Toast';
const Profile = () => {
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState(null);

    // Modal states
    const [isEditHeaderOpen, setIsEditHeaderOpen] = useState(false);
    const [isEditAboutOpen, setIsEditAboutOpen] = useState(false);
    const [isEditExpOpen, setIsEditExpOpen] = useState(false);
    const [isEditEduOpen, setIsEditEduOpen] = useState(false);
    const [isEditSkillsOpen, setIsEditSkillsOpen] = useState(false);

    // Form states
    const [editData, setEditData] = useState({});

    useEffect(() => {
        const user = storage.getCurrentUser();
        setUserData(user);
        setEditData(user);
        setLoading(false);
    }, []);

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
                                        <p className="lead fs-6 text-muted mb-2">{userData.role} at {userData.company}</p>
                                        <div className="d-flex flex-wrap align-items-center gap-3 text-muted extra-small">
                                            <span>{userData.batch} Batch</span>
                                            <span>&bull;</span>
                                            <span className="text-mamcet-red fw-bold">{userData.connections} connections</span>
                                            <span className="d-none d-md-inline">&bull;</span>
                                            <span className="d-none d-md-inline">{userData.views} profile views</span>
                                        </div>
                                    </div>
                                    <div className="d-flex flex-wrap gap-2 w-100 w-md-auto justify-content-md-end">
                                        <button className="btn btn-pro btn-pro-primary flex-grow-1 flex-md-grow-0">Open to</button>
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

                        {/* EXPERIENCE SECTION */}
                        <div className="dashboard-card bg-white shadow-sm p-4 mb-4 rounded-3 border-0">
                            <div className="d-flex justify-content-between align-items-center mb-4">
                                <h5 className="fw-bold mb-0 text-dark">Experience</h5>
                                <div className="d-flex gap-3">
                                    <button className="btn btn-link text-decoration-none p-0 btn-pro btn-pro-ghost-red">
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
                                    <button className="btn btn-link text-decoration-none p-0">
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
                                    <button className="btn btn-link text-decoration-none p-0">
                                        <i className="fas fa-plus text-mamcet-red"></i>
                                    </button>
                                    <button className="btn btn-link text-decoration-none p-0" onClick={() => setIsEditSkillsOpen(true)}>
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
                        <input type="text" className="form-control" name="name" value={editData.name} onChange={handleChange} />
                    </div>
                    <div className="col-12">
                        <label className="form-label extra-small fw-bold">Headline (Role)</label>
                        <input type="text" className="form-control" name="role" value={editData.role} onChange={handleChange} />
                    </div>
                    <div className="col-12">
                        <label className="form-label extra-small fw-bold">Current Company</label>
                        <input type="text" className="form-control" name="company" value={editData.company} onChange={handleChange} />
                    </div>
                    <div className="col-6">
                        <label className="form-label extra-small fw-bold">Profile Picture URL</label>
                        <input type="text" className="form-control" name="profilePic" value={editData.profilePic} onChange={handleChange} />
                    </div>
                    <div className="col-6">
                        <label className="form-label extra-small fw-bold">Cover Photo URL</label>
                        <input type="text" className="form-control" name="coverPic" value={editData.coverPic} onChange={handleChange} />
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
                    <textarea className="form-control" name="bio" rows="6" value={editData.bio} onChange={handleChange}></textarea>
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

export default Profile;
