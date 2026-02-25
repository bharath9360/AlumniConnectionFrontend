import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminNavbar from '../../components/admin/AdminNavbar';

/** * CONFIGURATION: Centralized form metadata and constants
 */
const FORM_CONFIG = {
  TITLE: "Add New Alumni",
  STORAGE_KEY: 'alumniData',
  SUCCESS_MSG: "Alumni Added Successfully!",
  REDIRECT_PATH: '/admin/alumni',
  DEPARTMENTS: ["CSE", "IT", "ECE", "EEE", "MECH", "CIVIL"],
  LABELS: {
    NAME: "Full Name",
    EMAIL: "Email",
    DEPT: "Department",
    BATCH: "Batch",
    ROLE: "Current Role",
    COMPANY: "Company Name",
    SAVE_BTN: "SAVE ALUMNI",
    CANCEL_BTN: "CANCEL"
  },
  PLACEHOLDERS: {
    BATCH: "2024",
    ROLE: "e.g. Software Engineer"
  }
};

/** * COMPONENT: FormField
 * Reusable input wrapper to prevent repetitive JSX
 */
const FormField = ({ label, children }) => (
  <div className="mb-3">
    <label className="form-label small fw-bold">{label}</label>
    {children}
  </div>
);

/** * MAIN COMPONENT: AddAlumni
 */
const AddAlumni = () => {
  const navigate = useNavigate();
  
  // Initial state driven by logic, not hardcoded strings
  const [formData, setFormData] = useState({
    name: '', 
    email: '', 
    dept: FORM_CONFIG.DEPARTMENTS[0], 
    batch: '', 
    role: '', 
    company: '', 
    status: 'Verified'
  });

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const existingData = JSON.parse(localStorage.getItem(FORM_CONFIG.STORAGE_KEY)) || [];
    const newData = { ...formData, id: Date.now() };
    
    const updatedList = [...existingData, newData];
    localStorage.setItem(FORM_CONFIG.STORAGE_KEY, JSON.stringify(updatedList));
    
    alert(FORM_CONFIG.SUCCESS_MSG);
    navigate(FORM_CONFIG.REDIRECT_PATH);
  };

  return (
    <div style={{ backgroundColor: '#fff', minHeight: '100vh' }}>
      <AdminNavbar />
      <div className="container py-5">
        <div className="card shadow-sm mx-auto p-4" style={{ maxWidth: '600px' }}>
          <h4 className="fw-bold text-danger mb-4">{FORM_CONFIG.TITLE}</h4>
          
          <form onSubmit={handleSubmit}>
            {/* Name Field */}
            <FormField label={FORM_CONFIG.LABELS.NAME}>
              <input 
                type="text" 
                className="form-control" 
                required 
                onChange={(e) => handleChange('name', e.target.value)} 
              />
            </FormField>

            {/* Email Field */}
            <FormField label={FORM_CONFIG.LABELS.EMAIL}>
              <input 
                type="email" 
                className="form-control" 
                required 
                onChange={(e) => handleChange('email', e.target.value)} 
              />
            </FormField>

            <div className="row">
              {/* Department Select */}
              <div className="col-md-6">
                <FormField label={FORM_CONFIG.LABELS.DEPT}>
                  <select 
                    className="form-select" 
                    value={formData.dept}
                    onChange={(e) => handleChange('dept', e.target.value)}
                  >
                    {FORM_CONFIG.DEPARTMENTS.map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </FormField>
              </div>

              {/* Batch Field */}
              <div className="col-md-6">
                <FormField label={FORM_CONFIG.LABELS.BATCH}>
                  <input 
                    type="number" 
                    className="form-control" 
                    placeholder={FORM_CONFIG.PLACEHOLDERS.BATCH} 
                    required 
                    onChange={(e) => handleChange('batch', e.target.value)} 
                  />
                </FormField>
              </div>
            </div>

            {/* Role Field */}
            <FormField label={FORM_CONFIG.LABELS.ROLE}>
              <input 
                type="text" 
                className="form-control" 
                placeholder={FORM_CONFIG.PLACEHOLDERS.ROLE} 
                onChange={(e) => handleChange('role', e.target.value)} 
              />
            </FormField>

            {/* Company Field */}
            <FormField label={FORM_CONFIG.LABELS.COMPANY}>
              <input 
                type="text" 
                className="form-control" 
                onChange={(e) => handleChange('company', e.target.value)} 
              />
            </FormField>

            {/* Action Buttons */}
            <div className="d-flex gap-2 mt-2">
              <button type="submit" className="btn btn-danger w-100 fw-bold">
                {FORM_CONFIG.LABELS.SAVE_BTN}
              </button>
              <button 
                type="button" 
                className="btn btn-outline-secondary w-100 fw-bold" 
                onClick={() => navigate(-1)}
              >
                {FORM_CONFIG.LABELS.CANCEL_BTN}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddAlumni;