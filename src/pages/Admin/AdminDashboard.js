import React, { useState } from 'react';
import '../../styles/Dashboard.css';
import DashboardOverview from './DashboardOverview';
import Post from './Post'; // 
const AdminDashboard = () => {
    const [activeTab, setActiveTab] = useState('ALUMNI');
    const [alumniStep, setAlumniStep] = useState('LIST');
    const [selectedUser, setSelectedUser] = useState(null);

    const [alumniList, setAlumniList] = useState([
        { id: 1, name: "Hari", email: "hari.cse22@mamcet.com", dept: "CSE", batch: "2026", status: "Verified" },
        { id: 2, name: "Hari", email: "hari.cse22@mamcet.com", dept: "CSE", batch: "2026", status: "Pending" },
        { id: 3, name: "Hari", email: "hari.cse22@mamcet.com", dept: "CSE", batch: "2026", status: "Verified" },
        { id: 4, name: "Hari", email: "hari.cse22@mamcet.com", dept: "CSE", batch: "2026", status: "Pending" },
    ]);

    const handleVerify = () => {
        const updatedList = alumniList.map(item => 
            item.id === selectedUser.id ? { ...item, status: 'Verified' } : item
        );
        setAlumniList(updatedList);
        setAlumniStep('SUCCESS');
    };

    return (
        <div className="admin-wrapper bg-light min-vh-100">

            {/* Header - ONLY this part updated */}
            <header className="bg-white shadow-sm border-bottom sticky-top py-2 px-4">
                <div className="container-fluid d-flex align-items-center justify-content-between flex-nowrap">

                    {/* Menu only */}
                    <nav className="d-flex gap-4 fw-bold small text-muted position-absolute top-50 start-50 translate-middle">
                        {['HOME', 'POST', 'ALUMNI', 'DASHBOARD'].map((tab) => (
                            <span 
                                key={tab}
                                onClick={() => { setActiveTab(tab); setAlumniStep('LIST'); }} 
                                className={`cursor-pointer pb-1 ${activeTab === tab ? 'text-danger border-bottom border-danger border-3' : ''}`}
                                style={{ cursor: 'pointer' }}
                            >
                                {tab}
                            </span>
                        ))}
                    </nav>

                    {/* Right side: Search box with only search icon */}
                    <div className="d-flex align-items-center gap-3 flex-nowrap ms-auto">
                        <div className="search-pill d-flex align-items-center px-3 py-1 border rounded-pill bg-light small">
                            <i className="fas fa-search text-muted"></i>
                            <input 
                                type="text" 
                                placeholder="Search" 
                                className="border-0 bg-transparent outline-none ms-2" 
                                style={{width: '120px'}}
                            />
                        </div>
                    </div>

                </div>
            </header>

            {/* Content */}
            <div className="container py-4">
                {activeTab === 'ALUMNI' && (
                    <div className="alumni-section animate__animated animate__fadeIn">
                        
                        {/* Alumni LIST */}
                        {alumniStep === 'LIST' && (
                            <>
                                <h2 className="text-center brand-red-text fw-bold mb-4 mt-2">Alumni Management</h2>
                                <div className="max-width-lg mx-auto mb-4 px-5">
                                    <div className="input-group mb-3 shadow-sm rounded-3 border">
                                        <span className="input-group-text bg-white border-0"><i className="fas fa-search text-muted"></i></span>
                                        <input type="text" className="form-control border-0 py-2" placeholder="Search ......." />
                                    </div>
                                    <div className="d-flex gap-3">
                                        <select className="form-select w-auto border shadow-sm small rounded-3"><option>Batch v</option></select>
                                        <select className="form-select w-auto border shadow-sm small rounded-3"><option>Department v</option></select>
                                        <select className="form-select w-auto border shadow-sm small rounded-3"><option>Year v</option></select>
                                    </div>
                                </div>

                                <div className="card border-0 shadow-sm rounded-4 overflow-hidden mt-4 mx-4">
                                    <table className="table mb-0 text-center align-middle">
                                        <thead className="bg-light small">
                                            <tr><th>Name</th><th>Email</th><th>Department</th><th>Batch</th><th>Status</th><th>Actions</th></tr>
                                        </thead>
                                        <tbody className="small">
                                            {alumniList.map((item) => (
                                                <tr key={item.id}>
                                                    <td>{item.name}</td><td>{item.email}</td><td>{item.dept}</td><td>{item.batch}</td>
                                                    <td>
                                                        <span className={`badge rounded-pill px-3 ${item.status === 'Verified' ? 'bg-primary' : 'bg-danger'}`}>
                                                            {item.status}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <button 
                                                            onClick={() => { setSelectedUser(item); setAlumniStep('REVIEW'); }}
                                                            className="btn btn-link text-dark text-decoration-none small fw-bold"
                                                        >
                                                            {item.status === 'Pending' ? 'Verify' : 'View'}
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    <div className="p-3 bg-white d-flex justify-content-end gap-3 border-top">
                                        <button className="btn btn-outline-secondary btn-sm px-4 rounded-3 fw-bold">Export</button>
                                        <button className="btn btn-danger btn-sm px-4 rounded-3 fw-bold">Add Alumni</button>
                                    </div>
                                </div>
                            </>
                        )}

                        {/* REVIEW APPLICATION */}
                        {alumniStep === 'REVIEW' && selectedUser && (
                            <div className="max-width-md mx-auto">
                                <h2 className="text-center brand-red-text fw-bold mb-4">REVIEW APPLICATION</h2>
                                <div className="card border-0 shadow-lg rounded-4 p-4">
                                    <div className="text-center mb-3">
                                        <div className="profile-avatar-lg mx-auto mb-3 bg-light rounded-circle overflow-hidden" style={{width:'100px', height:'100px'}}>
                                            <img src="https://via.placeholder.com/100" alt="user" />
                                        </div>
                                        <h4 className="fw-bold mb-0">Harilakshminarayana</h4>
                                        <p className="text-muted small">Batch of 2022 - 2026 , CSE<br/>UIUX Designer at ABC Company</p>
                                    </div>
                                    <div className="d-flex justify-content-end gap-4 mt-5 px-3">
                                        <button onClick={() => setAlumniStep('LIST')} className="btn text-muted fw-bold">Cancel</button>
                                        <button onClick={handleVerify} className="btn btn-primary px-5 rounded-3 fw-bold shadow-sm">Verify</button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* SUCCESS */}
                        {alumniStep === 'SUCCESS' && (
                            <div className="animate__animated animate__zoomIn text-center py-5">
                                <div className="card border-0 shadow-lg rounded-5 p-5 mx-auto" style={{maxWidth: '500px'}}>
                                    <img src="https://cdn-icons-png.flaticon.com/512/190/190411.png" width="120" className="mx-auto mb-4" alt="success" />
                                    <h2 className="fw-bold brand-red-text mb-1 fs-3">SUCCESSFULLY VERIFIED</h2>
                                    <p className="text-muted small mb-4">ADDED AS MAMCET ALUMNI</p>
                                    <button onClick={() => { setAlumniStep('LIST'); setSelectedUser(null); }} className="btn btn-primary px-5 rounded-pill fw-bold py-2 shadow">Go Back</button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
                {activeTab === 'DASHBOARD' && <DashboardOverview />}
                {activeTab === 'POST' && <Post />}
            </div>
        </div>
    );
};

export default AdminDashboard;