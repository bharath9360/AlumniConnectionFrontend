import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';

/** * CONFIGURATION: Centralized data to eliminate hardcoding 
 */
const CONFIG = {
  LABELS: {
    PAGE_TITLE: "Alumni Management",
    SEARCH_PLACEHOLDER: "Search by Name or Email...",
    FILTER_ALL_BATCHES: "All Batches",
    FILTER_ALL_DEPTS: "All Departments",
    TABLE_HEADERS: ["Name", "Email", "Department", "Batch", "Status", "Actions"],
    BTN_EXPORT: "Export",
    BTN_ADD: "Add Alumni",
    STATUS_VERIFIED: "Verified",
    STATUS_PENDING: "Pending",
    ACTION_VIEW: "View",
    ACTION_VERIFY: "Verify"
  },
  INITIAL_DATA: [
    { id: 1, name: 'Hari', email: 'hari.cse22@mamcet.com', dept: 'CSE', batch: '2026', status: 'Verified', role: 'UIUX Designer', company: 'ABC Company' },
    { id: 2, name: 'Shalini', email: 'shalini.ece26@mamcet.com', dept: 'ECE', batch: '2026', status: 'Pending', role: 'Frontend Developer', company: 'Google' },
    { id: 3, name: 'Kumar', email: 'kumar.it22@mamcet.com', dept: 'IT', batch: '2025', status: 'Verified', role: 'Software Engineer', company: 'Amazon' },
    { id: 4, name: 'Deepak', email: 'deepak.mech22@mamcet.com', dept: 'MECH', batch: '2026', status: 'Pending', role: 'Production Engineer', company: 'Tesla' },
    { id: 5, name: 'Priya', email: 'priya.eee22@mamcet.com', dept: 'EEE', batch: '2024', status: 'Verified', role: 'Data Scientist', company: 'Microsoft' },
    { id: 6, name: 'Arjun', email: 'arjun.civil22@mamcet.com', dept: 'CIVIL', batch: '2026', status: 'Pending', role: 'Site Engineer', company: 'L&T' }
  ],
  STORAGE_KEY: 'alumniData',
  EXPORT_FILE_NAME: "Alumni_Details.xlsx",
  PATHS: {
    REVIEW: '/admin/review-application',
    PROFILE: '/admin/view-profile',
    ADD: '/admin/add-alumni'
  }
};

/** * COMPONENT: SearchBar 
 */
const SearchBar = ({ onChange, placeholder }) => (
  <div className="d-flex justify-content-center mb-3">
    <div className="input-group w-75 shadow-sm border rounded-pill overflow-hidden bg-white">
      <span className="input-group-text bg-white border-0 ps-3">
        <i className="fas fa-search text-muted"></i>
      </span>
      <input 
        type="text" 
        className="form-control border-0 shadow-none px-2 py-2" 
        placeholder={placeholder} 
        onChange={(e) => onChange(e.target.value)} 
      />
    </div>
  </div>
);

/** * COMPONENT: FilterSection 
 */
const FilterSection = ({ batches, depts, onBatchChange, onDeptChange, labels }) => (
  <div className="d-flex justify-content-center gap-2 mb-4">
    <select className="form-select w-auto rounded shadow-sm small text-muted" onChange={(e) => onBatchChange(e.target.value)}>
      <option value="">{labels.FILTER_ALL_BATCHES}</option>
      {batches.map(b => <option key={b} value={b}>{b}</option>)}
    </select>
    <select className="form-select w-auto rounded shadow-sm small text-muted" onChange={(e) => onDeptChange(e.target.value)}>
      <option value="">{labels.FILTER_ALL_DEPTS}</option>
      {depts.map(d => <option key={d} value={d}>{d}</option>)}
    </select>
  </div>
);

/** * MAIN COMPONENT: AlumniManagement 
 */
const AlumniManagement = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [alumniList, setAlumniList] = useState([]);
  const [filterBatch, setFilterBatch] = useState("");
  const [filterDept, setFilterDept] = useState("");

  useEffect(() => {
    const savedData = JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEY));
    if (savedData && savedData.length > 0) {
      setAlumniList(savedData);
    } else {
      setAlumniList(CONFIG.INITIAL_DATA);
      localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(CONFIG.INITIAL_DATA));
    }
  }, []);

  const handleExport = () => {
    const worksheet = XLSX.utils.json_to_sheet(filteredAlumni);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "AlumniData");
    XLSX.writeFile(workbook, CONFIG.EXPORT_FILE_NAME);
  };

  const handleAction = (alumni) => {
    const path = alumni.status === CONFIG.LABELS.STATUS_PENDING 
      ? CONFIG.PATHS.REVIEW 
      : CONFIG.PATHS.PROFILE;
    navigate(path, { state: { alumni } });
  };

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
      <div className="container py-5 text-center">
        <h3 className="fw-bold mb-4" style={{ color: '#b22222' }}>{CONFIG.LABELS.PAGE_TITLE}</h3>
        
        <SearchBar onChange={setSearchTerm} placeholder={CONFIG.LABELS.SEARCH_PLACEHOLDER} />

        <FilterSection 
          batches={batches} 
          depts={depts} 
          onBatchChange={setFilterBatch} 
          onDeptChange={setFilterDept} 
          labels={CONFIG.LABELS} 
        />

        <div className="table-responsive shadow-sm border rounded bg-white">
          <table className="table table-hover align-middle mb-0">
            <thead className="bg-light">
              <tr className="small text-muted text-uppercase" style={{ fontSize: '12px' }}>
                {CONFIG.LABELS.TABLE_HEADERS.map(header => (
                  <th key={header} className="py-3 text-center">{header}</th>
                ))}
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
                    <span className={`badge rounded-pill ${al.status === CONFIG.LABELS.STATUS_VERIFIED ? 'bg-primary' : 'bg-danger'}`} 
                          style={{ padding: '6px 12px', minWidth: '85px' }}>
                      {al.status}
                    </span>
                  </td>
                  <td>
                    <button className="btn btn-link text-decoration-none fw-bold p-0" onClick={() => handleAction(al)}>
                      {al.status === CONFIG.LABELS.STATUS_VERIFIED ? CONFIG.LABELS.ACTION_VIEW : CONFIG.LABELS.ACTION_VERIFY}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 d-flex justify-content-center gap-3">
          <button className="btn btn-outline-dark rounded shadow-sm px-4 fw-bold" onClick={handleExport}>
            {CONFIG.LABELS.BTN_EXPORT}
          </button>
          <button className="btn btn-danger rounded shadow-sm px-4 fw-bold" onClick={() => navigate(CONFIG.PATHS.ADD)}>
            {CONFIG.LABELS.BTN_ADD}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AlumniManagement;