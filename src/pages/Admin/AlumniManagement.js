import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminNavbar from '../../components/admin/AdminNavbar';
import * as XLSX from 'xlsx'; // சரியான இம்போர்ட் முறை

const AlumniManagement = () => {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState("");
    const [alumniList, setAlumniList] = useState([]);
    
    // Filters State
    const [filterBatch, setFilterBatch] = useState("");
    const [filterDept, setFilterDept] = useState("");

    useEffect(() => {
        const savedData = JSON.parse(localStorage.getItem('alumniData'));
        if (savedData && savedData.length > 0) {
            setAlumniList(savedData);
        } else {
            const initialData = [
                { id: 1, name: 'Hari', email: 'hari.cse22@mamcet.com', dept: 'CSE', batch: '2026', status: 'Verified', role: 'UIUX Designer', company: 'ABC Company' },
                { id: 2, name: 'Shalini', email: 'shalini.ece26@mamcet.com', dept: 'ECE', batch: '2026', status: 'Pending', role: 'Frontend Developer', company: 'Google' },
                { id: 3, name: 'Kumar', email: 'kumar.it22@mamcet.com', dept: 'IT', batch: '2025', status: 'Verified', role: 'Software Engineer', company: 'Amazon' },
                { id: 4, name: 'Deepak', email: 'deepak.mech22@mamcet.com', dept: 'MECH', batch: '2026', status: 'Pending', role: 'Production Engineer', company: 'Tesla' },
                { id: 5, name: 'Priya', email: 'priya.eee22@mamcet.com', dept: 'EEE', batch: '2024', status: 'Verified', role: 'Data Scientist', company: 'Microsoft' },
                { id: 6, name: 'Arjun', email: 'arjun.civil22@mamcet.com', dept: 'CIVIL', batch: '2026', status: 'Pending', role: 'Site Engineer', company: 'L&T' }
            ];
            setAlumniList(initialData);
            localStorage.setItem('alumniData', JSON.stringify(initialData));
        }
    }, []);

    const handleExport = () => {
        const worksheet = XLSX.utils.json_to_sheet(filteredAlumni);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "AlumniData");
        XLSX.writeFile(workbook, "Alumni_Details.xlsx");
    };

    const handleAction = (alumni) => {
        if (alumni.status === 'Pending') {
            navigate('/admin/review-application', { state: { alumni } });
        } else {
            navigate('/admin/view-profile', { state: { alumni } });
        }
    };

    // Dynamic Filter Logic
    const filteredAlumni = alumniList.filter(al => {
        const matchesSearch = al.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                              al.email.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesBatch = filterBatch === "" || al.batch === filterBatch;
        const matchesDept = filterDept === "" || al.dept === filterDept;
        return matchesSearch && matchesBatch && matchesDept;
    });

    const batches = [...new Set(alumniList.map(item => item.batch))].sort();
    const depts = [...new Set(alumniList.map(item => item.dept))].sort();

    return (
        <div style={{ backgroundColor: '#fff', minHeight: '100vh' }}>
            <AdminNavbar />
            <div className="container py-5 text-center">
                <h3 className="fw-bold mb-4" style={{ color: '#b22222' }}>Alumni Management</h3>
                
                <div className="d-flex justify-content-center mb-3">
                    <div className="input-group w-75 shadow-sm border rounded-pill overflow-hidden bg-white">
                        <span className="input-group-text bg-white border-0 ps-3">
                            <i className="fas fa-search text-muted"></i>
                        </span>
                        <input 
                            type="text" 
                            className="form-control border-0 shadow-none px-2 py-2" 
                            placeholder="Search by Name or Email..." 
                            onChange={(e) => setSearchTerm(e.target.value)} 
                        />
                    </div>
                </div>

                <div className="d-flex justify-content-center gap-2 mb-4">
                    <select className="form-select w-auto rounded shadow-sm small text-muted" onChange={(e) => setFilterBatch(e.target.value)}>
                        <option value="">All Batches</option>
                        {batches.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                    <select className="form-select w-auto rounded shadow-sm small text-muted" onChange={(e) => setFilterDept(e.target.value)}>
                        <option value="">All Departments</option>
                        {depts.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                </div>

                <div className="table-responsive shadow-sm border rounded bg-white">
                    <table className="table table-hover align-middle mb-0">
                        <thead className="bg-light">
                            <tr className="small text-muted text-uppercase" style={{ fontSize: '12px' }}>
                                <th className="py-3 text-center">Name</th>
                                <th className="text-center">Email</th>
                                <th className="text-center">Department</th>
                                <th className="text-center">Batch</th>
                                <th className="text-center">Status</th>
                                <th className="text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody style={{ fontSize: '14px' }}>
                            {filteredAlumni.map((al) => (
                                <tr key={al.id}>
                                    <td className="fw-bold">{al.name}</td>
                                    <td className="text-muted">{al.email}</td>
                                    <td>{al.dept}</td>
                                    <td>{al.batch}</td>
                                    <td>
                                        <span className={`badge rounded-pill ${al.status === 'Verified' ? 'bg-primary' : 'bg-danger'}`} 
                                              style={{ padding: '6px 12px', minWidth: '85px' }}>
                                            {al.status}
                                        </span>
                                    </td>
                                    <td>
                                        <button className="btn btn-link text-decoration-none fw-bold p-0" onClick={() => handleAction(al)}>
                                            {al.status === 'Verified' ? 'View' : 'Verify'}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="mt-4 d-flex justify-content-center gap-3">
                    <button className="btn btn-outline-dark rounded shadow-sm px-4 fw-bold" onClick={handleExport}>Export</button>
                    <button className="btn btn-danger rounded shadow-sm px-4 fw-bold" onClick={() => navigate('/admin/add-alumni')}>Add Alumni</button>
                </div>
            </div>
        </div>
    );
};

export default AlumniManagement; // Default Export