import React, { useState, useEffect, useRef } from 'react';
import { storage } from '../../utils/storage';
import Toast from '../../components/common/Toast';
import { FaCamera, FaPencilAlt, FaPlus, FaBriefcase, FaUniversity, FaTimes } from 'react-icons/fa';

const Profile = () => {
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState(null);

    const [editingSection, setEditingSection] = useState(null);
    const [editData, setEditData] = useState({});
    const [skillsInput, setSkillsInput] = useState("");

    // File inputs refs
    const profilePicInputRef = useRef(null);
    const coverPicInputRef = useRef(null);

    useEffect(() => {
        const user = storage.getCurrentUser();
        setUserData(user);
        setEditData(user || {});
        setLoading(false);
    }, []);

    const showToast = (message, type) => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const handleSave = () => {
        const parsedSkills = skillsInput.split(',').map(s => s.trim()).filter(s => s);
        const finalData = { ...editData, skills: parsedSkills };
        storage.updateCurrentUser(finalData);
        setUserData(finalData);
        setEditingSection(null);
        showToast("Profile updated successfully!", "success");
    };

    const handleCancel = () => {
        setEditData(userData);
        setEditingSection(null);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setEditData(prev => ({ ...prev, [name]: value }));
    };

    const handleArrayChange = (arrayName, index, field, value) => {
        setEditData(prev => {
            const newArray = [...(prev[arrayName] || [])];
            newArray[index] = { ...newArray[index], [field]: value };
            return { ...prev, [arrayName]: newArray };
        });
    };

    const addArrayItem = (arrayName, defaultItem) => {
        setEditData(prev => ({
            ...prev,
            [arrayName]: [...(prev[arrayName] || []), { ...defaultItem, id: Date.now() }]
        }));
    };

    const removeArrayItem = (arrayName, index) => {
        setEditData(prev => {
            const newArray = [...(prev[arrayName] || [])];
            newArray.splice(index, 1);
            return { ...prev, [arrayName]: newArray };
        });
    };

    // Using local state for skills input during editing to prevent trimming trailing commas

    const handlePhotoUpload = (e, fieldName) => {
        const file = e.target.files[0];
        if (file) {
            const fileUrl = URL.createObjectURL(file);
            setEditData(prev => ({ ...prev, [fieldName]: fileUrl }));
        }
    };

    if (loading) return <div className="p-5 text-center">Loading Profile...</div>;

    if (!userData) return (
        <div className="p-5 text-center min-vh-100 d-flex flex-column align-items-center justify-content-center">
            <h4>No Profile Data Found</h4>
            <p className="text-muted">Please login to view your profile.</p>
            <a href="/login" className="btn btn-mamcet-red px-4 mt-2">Go to Login</a>
        </div>
    );

    const displayData = editingSection ? editData : userData;

    return (
        <div className="py-4 min-vh-100" style={{ backgroundColor: '#f3f2ef' }}>
            <div className="container" style={{ maxWidth: '850px' }}>

                {/* STICKY EDIT ACTION BAR */}
                {editingSection && (
                    <div className="position-fixed bottom-0 start-0 end-0 bg-white p-3 shadow-lg border-top d-flex justify-content-end gap-2" style={{ zIndex: 1050 }}>
                        <button className="btn btn-outline-secondary fw-bold px-4 rounded-pill" onClick={handleCancel}>
                            Cancel
                        </button>
                        <button className="btn btn-mamcet-red fw-bold px-4 rounded-pill" style={{ backgroundColor: '#c84022', color: 'white' }} onClick={handleSave}>
                            Save Changes
                        </button>
                    </div>
                )}

                <div className="row justify-content-center">
                    <div className="col-12">

                        {/* HERO HEADER SECTION */}
                        <div className="bg-white shadow-sm overflow-hidden mb-4 rounded-3 border-0 position-relative">
                            {/* Cover Photo */}
                            <div className="position-relative" style={{ height: '220px', backgroundColor: '#a0b4b7' }}>
                                <img
                                    src={displayData.coverPic || "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80"}
                                    alt="Cover"
                                    className="w-100 h-100 object-fit-cover"
                                />
                                {editingSection === 'hero' && (
                                    <>
                                        <button
                                            className="btn btn-light position-absolute top-0 end-0 m-3 shadow rounded-circle d-flex align-items-center justify-content-center"
                                            style={{ width: '40px', height: '40px', color: '#c84022' }}
                                            onClick={() => coverPicInputRef.current.click()}
                                        >
                                            <FaCamera />
                                        </button>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            ref={coverPicInputRef}
                                            className="d-none"
                                            onChange={(e) => handlePhotoUpload(e, 'coverPic')}
                                        />
                                    </>
                                )}
                            </div>

                            <div className="px-4 pb-4 position-relative">
                                {/* Profile Avatar */}
                                <div className="position-relative d-inline-block" style={{ marginTop: '-110px' }}>
                                    <div className="shadow-lg bg-white" style={{
                                        width: '160px', height: '160px', borderRadius: '50%',
                                        border: '4px solid white', overflow: 'hidden', display: 'flex',
                                        alignItems: 'center', justifyContent: 'center', fontSize: '4rem',
                                        fontWeight: 'bold', color: '#c84022'
                                    }}>
                                        {displayData.profilePic ? (
                                            <img src={displayData.profilePic} alt="Profile" className="w-100 h-100 object-fit-cover" />
                                        ) : (displayData.name?.[0] || "?")}
                                    </div>

                                    {editingSection === 'hero' && (
                                        <>
                                            <button
                                                className="btn btn-light position-absolute shadow rounded-circle d-flex align-items-center justify-content-center"
                                                style={{ width: '40px', height: '40px', color: '#c84022', bottom: '10px', right: '10px' }}
                                                onClick={() => profilePicInputRef.current.click()}
                                            >
                                                <FaCamera />
                                            </button>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                ref={profilePicInputRef}
                                                className="d-none"
                                                onChange={(e) => handlePhotoUpload(e, 'profilePic')}
                                            />
                                        </>
                                    )}
                                </div>

                                {/* Header Text Content */}
                                <div className="mt-3">
                                    {!editingSection && (
                                        <button className="btn btn-sm text-muted position-absolute top-0 end-0 m-3" onClick={() => setEditingSection('hero')}>
                                            <FaPencilAlt size={18} />
                                        </button>
                                    )}
                                    {editingSection !== 'hero' ? (
                                        <>
                                            <h2 className="fw-bold mb-1 text-dark">{displayData.name}</h2>
                                            <p className="fs-5 text-dark mb-2">{displayData.role} {displayData.company ? `at ${displayData.company}` : ''}</p>
                                            <div className="d-flex flex-wrap align-items-center gap-3 text-muted small">
                                                <span>{displayData.batch} Batch</span>
                                                <span>&bull;</span>
                                                <span className="fw-bold" style={{ color: '#c84022' }}>{displayData.connections || 500}+ connections</span>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="row g-3 mt-1">
                                            <div className="col-md-6">
                                                <label className="form-label extra-small fw-bold text-muted text-uppercase mb-1">Full Name</label>
                                                <input type="text" className="form-control fw-bold fs-5" name="name" value={editData.name || ''} onChange={handleChange} />
                                            </div>
                                            <div className="col-md-6">
                                                <label className="form-label extra-small fw-bold text-muted text-uppercase mb-1">Batch</label>
                                                <input type="text" className="form-control" name="batch" value={editData.batch || ''} onChange={handleChange} />
                                            </div>
                                            <div className="col-md-6">
                                                <label className="form-label extra-small fw-bold text-muted text-uppercase mb-1">Headline / Role</label>
                                                <input type="text" className="form-control" name="role" value={editData.role || ''} onChange={handleChange} />
                                            </div>
                                            <div className="col-md-6">
                                                <label className="form-label extra-small fw-bold text-muted text-uppercase mb-1">Company</label>
                                                <input type="text" className="form-control" name="company" value={editData.company || ''} onChange={handleChange} />
                                            </div>
                                            <div className="col-md-6">
                                                <label className="form-label extra-small fw-bold text-muted text-uppercase mb-1">Connections</label>
                                                <input type="text" className="form-control" name="connections" value={editData.connections || ''} onChange={handleChange} />
                                            </div>
                                            <div className="col-md-6">
                                                <label className="form-label extra-small fw-bold text-muted text-uppercase mb-1">Profile Views</label>
                                                <input type="number" className="form-control" name="views" value={editData.views || ''} onChange={handleChange} />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* ABOUT SECTION */}
                        <div className="bg-white shadow-sm p-4 mb-4 rounded-3 border-0 position-relative">
                            <div className="d-flex justify-content-between align-items-center mb-3">
                                <h4 className="fw-bold mb-0 text-dark">About</h4>
                                {!editingSection && (
                                    <button className="btn btn-sm text-muted" onClick={() => setEditingSection('about')}>
                                        <FaPencilAlt size={16} />
                                    </button>
                                )}
                            </div>
                            {editingSection !== 'about' ? (
                                <p className="text-dark mb-0" style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
                                    {displayData.bio || "No summary provided. Edit profile to add one."}
                                </p>
                            ) : (
                                <textarea
                                    className="form-control"
                                    name="bio"
                                    rows="4"
                                    value={editData.bio || ''}
                                    onChange={handleChange}
                                    placeholder="Write a brief summary about your professional background..."
                                ></textarea>
                            )}
                        </div>

                        {/* EXPERIENCE SECTION */}
                        <div className="bg-white shadow-sm p-4 mb-4 rounded-3 border-0">
                            <div className="d-flex justify-content-between align-items-center mb-4">
                                <h4 className="fw-bold mb-0 text-dark">Experience</h4>
                                {!editingSection ? (
                                    <button className="btn btn-sm text-muted" onClick={() => setEditingSection('experience')}>
                                        <FaPencilAlt size={16} />
                                    </button>
                                ) : editingSection === 'experience' && (
                                    <button
                                        className="btn btn-sm btn-outline-secondary rounded-pill d-flex align-items-center gap-2 px-3"
                                        onClick={() => addArrayItem('experience', { title: '', company: '', duration: '', desc: '' })}
                                    >
                                        <FaPlus size={12} /> Add Role
                                    </button>
                                )}
                            </div>

                            {(displayData.experience || []).length === 0 && editingSection !== 'experience' ? (
                                <p className="text-muted">No experience listed.</p>
                            ) : (
                                (displayData.experience || []).map((exp, idx) => (
                                    <div key={exp.id || idx} className={`d-flex gap-3 position-relative ${idx !== (displayData.experience.length - 1) ? 'mb-4 pb-4 border-bottom' : ''}`}>
                                        <div className="bg-light rounded p-3 d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: '48px', height: '48px' }}>
                                            <FaBriefcase className="text-secondary fs-5" />
                                        </div>

                                        {editingSection !== 'experience' ? (
                                            <div className="flex-grow-1">
                                                <h6 className="fw-bold mb-0 fs-5">{exp.title}</h6>
                                                <p className="text-dark mb-1">{exp.company}</p>
                                                <p className="small text-muted mb-2">{exp.duration}</p>
                                                <p className="text-dark mb-0" style={{ lineHeight: '1.5' }}>{exp.desc}</p>
                                            </div>
                                        ) : (
                                            <div className="flex-grow-1 row g-2">
                                                <div className="col-12 text-end">
                                                    <button className="btn btn-sm text-danger p-0" onClick={() => removeArrayItem('experience', idx)}>
                                                        <FaTimes /> Remove
                                                    </button>
                                                </div>
                                                <div className="col-md-6">
                                                    <input type="text" className="form-control form-control-sm fw-bold" placeholder="Job Title" value={exp.title || ''} onChange={e => handleArrayChange('experience', idx, 'title', e.target.value)} />
                                                </div>
                                                <div className="col-md-6">
                                                    <input type="text" className="form-control form-control-sm" placeholder="Company Name" value={exp.company || ''} onChange={e => handleArrayChange('experience', idx, 'company', e.target.value)} />
                                                </div>
                                                <div className="col-12">
                                                    <input type="text" className="form-control form-control-sm" placeholder="Duration (e.g., Jan 2020 - Present)" value={exp.duration || ''} onChange={e => handleArrayChange('experience', idx, 'duration', e.target.value)} />
                                                </div>
                                                <div className="col-12">
                                                    <textarea className="form-control form-control-sm" rows="2" placeholder="Description" value={exp.desc || ''} onChange={e => handleArrayChange('experience', idx, 'desc', e.target.value)}></textarea>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>

                        {/* EDUCATION SECTION */}
                        <div className="bg-white shadow-sm p-4 mb-4 rounded-3 border-0">
                            <div className="d-flex justify-content-between align-items-center mb-4">
                                <h4 className="fw-bold mb-0 text-dark">Education</h4>
                                {!editingSection ? (
                                    <button className="btn btn-sm text-muted" onClick={() => setEditingSection('education')}>
                                        <FaPencilAlt size={16} />
                                    </button>
                                ) : editingSection === 'education' && (
                                    <button
                                        className="btn btn-sm btn-outline-secondary rounded-pill d-flex align-items-center gap-2 px-3"
                                        onClick={() => addArrayItem('education', { school: '', degree: '', duration: '' })}
                                    >
                                        <FaPlus size={12} /> Add School
                                    </button>
                                )}
                            </div>

                            {(displayData.education || []).length === 0 && editingSection !== 'education' ? (
                                <p className="text-muted">No education listed.</p>
                            ) : (
                                (displayData.education || []).map((edu, idx) => (
                                    <div key={edu.id || idx} className={`d-flex gap-3 position-relative ${idx !== (displayData.education.length - 1) ? 'mb-4 pb-4 border-bottom' : ''}`}>
                                        <div className="bg-light rounded p-3 d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: '48px', height: '48px' }}>
                                            <FaUniversity className="text-secondary fs-5" />
                                        </div>

                                        {editingSection !== 'education' ? (
                                            <div className="flex-grow-1">
                                                <h6 className="fw-bold fs-5 mb-0">{edu.school}</h6>
                                                <p className="text-dark mb-1">{edu.degree}</p>
                                                <p className="small text-muted mb-0">{edu.duration}</p>
                                            </div>
                                        ) : (
                                            <div className="flex-grow-1 row g-2">
                                                <div className="col-12 text-end">
                                                    <button className="btn btn-sm text-danger p-0" onClick={() => removeArrayItem('education', idx)}>
                                                        <FaTimes /> Remove
                                                    </button>
                                                </div>
                                                <div className="col-md-12">
                                                    <input type="text" className="form-control form-control-sm fw-bold" placeholder="School/University Name" value={edu.school || ''} onChange={e => handleArrayChange('education', idx, 'school', e.target.value)} />
                                                </div>
                                                <div className="col-md-6">
                                                    <input type="text" className="form-control form-control-sm" placeholder="Degree/Field of Study" value={edu.degree || ''} onChange={e => handleArrayChange('education', idx, 'degree', e.target.value)} />
                                                </div>
                                                <div className="col-md-6">
                                                    <input type="text" className="form-control form-control-sm" placeholder="Duration (e.g., 2018 - 2022)" value={edu.duration || ''} onChange={e => handleArrayChange('education', idx, 'duration', e.target.value)} />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>

                        {/* SKILLS SECTION */}
                        <div className="bg-white shadow-sm p-4 mb-4 rounded-3 border-0 pb-5">
                            <div className="d-flex justify-content-between align-items-center mb-4">
                                <h4 className="fw-bold mb-0 text-dark">Skills</h4>
                                {!editingSection && (
                                    <button className="btn btn-sm text-muted" onClick={() => { setEditingSection('skills'); setSkillsInput((userData.skills || []).join(', ')); }}>
                                        <FaPencilAlt size={16} />
                                    </button>
                                )}
                            </div>

                            {editingSection !== 'skills' ? (
                                <div className="d-flex flex-wrap gap-2">
                                    {(displayData.skills || []).length > 0 ? (
                                        displayData.skills.map((skill, idx) => (
                                            <span key={idx} className="badge bg-light text-dark border p-2 px-3 rounded-pill fw-semibold fs-6">
                                                {skill}
                                            </span>
                                        ))
                                    ) : (
                                        <p className="text-muted">No skills added yet.</p>
                                    )}
                                </div>
                            ) : (
                                <div>
                                    <label className="form-label small text-muted">Enter skills separated by commas</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={skillsInput}
                                        onChange={(e) => setSkillsInput(e.target.value)}
                                        placeholder="e.g., React, Node.js, Project Management"
                                    />
                                    <div className="d-flex flex-wrap gap-2 mt-3">
                                        {skillsInput.split(',').map(s => s.trim()).filter(s => s).map((skill, idx) => (
                                            <span key={idx} className="badge bg-light text-dark border p-2 px-3 rounded-pill fw-semibold">
                                                {skill}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                    </div>
                </div>
            </div>

            {toast && (
                <div style={{ position: 'fixed', bottom: '20px', right: '20px', zIndex: 9999 }}>
                    <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
                </div>
            )}
        </div>
    );
};

export default Profile;
