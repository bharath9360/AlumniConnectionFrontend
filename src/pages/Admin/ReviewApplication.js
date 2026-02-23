import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import AdminNavbar from '../../components/admin/AdminNavbar';

/** * CONFIGURATION: Centralized labels and fallback data to avoid hardcoding inside the UI
 */
const CONFIG = {
  LABELS: {
    PAGE_TITLE: "REVIEW APPLICATION",
    ABOUT: "ABOUT",
    EXPERIENCE: "EXPERIENCE",
    EDUCATION: "EDUCATION",
    CANCEL_BTN: "CANCEL",
    VERIFY_BTN: "VERIFY"
  },
  FALLBACK: {
    NAME: "Harilakshminarayana",
    DEPT: "CSE",
    BATCH: "2022 - 2026",
    ROLE: "UIUX Designer at ABC Company",
    ABOUT_TEXT: "UI/UX Designer with 1+ years of experience... skilled in visual design and front-end development.",
    EXP_ROLE: "UIUX Designer",
    EXP_YEAR: "2023 - 2025",
    EDU_DEGREE: "Bachelor of Engineering in Computer science and Engineering",
    EDU_YEAR: "2022 - 2026",
    IMAGE: "https://via.placeholder.com/100"
  },
  PATHS: {
    SUCCESS: '/admin/verify-success'
  }
};

/** * COMPONENT: ProfileHeader
 * Renders the top section with image and basic info
 */
const ProfileHeader = ({ name, batch, dept, role, image }) => (
  <div className="mb-4">
    <img src={image} className="rounded-circle border" alt="profile" />
    <h5 className="fw-bold mt-3">{name}</h5>
    <p className="text-muted small mb-0">Batch of {batch} , {dept}</p>
    <p className="text-muted small">{role}</p>
  </div>
);

/** * COMPONENT: DetailSection
 * Reusable layout for About, Experience, and Education
 */
const DetailSection = ({ title, children }) => (
  <div className="text-start px-4 mb-4">
    <h6 className="fw-bold text-uppercase">{title}</h6>
    {children}
  </div>
);

/** * COMPONENT: ActionButtons
 * Handles navigation logic
 */
const ActionButtons = ({ onCancel, onVerify, labels }) => (
  <div className="mt-5 d-flex justify-content-end gap-4">
    <button className="btn border-0 text-muted fw-bold" onClick={onCancel}>
      {labels.CANCEL_BTN}
    </button>
    <button className="btn btn-primary rounded-pill px-5 fw-bold shadow-sm" onClick={onVerify}>
      {labels.VERIFY_BTN}
    </button>
  </div>
);

/** * MAIN COMPONENT: ReviewApplication
 */
const ReviewApplication = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const alumni = state?.alumni;

  // Function: Navigate to success page
  const handleVerify = () => {
    navigate(CONFIG.PATHS.SUCCESS, { state: { alumni } });
  };

  return (
    <div style={{ backgroundColor: '#fff', minHeight: '100vh' }}>
      <AdminNavbar />
      
      <div className="container py-5 text-center">
        <h4 className="fw-bold mb-5" style={{ color: '#b22222', letterSpacing: '1px' }}>
          {CONFIG.LABELS.PAGE_TITLE}
        </h4>
        
        <div className="card border-0 shadow-sm mx-auto p-4" style={{ maxWidth: '700px', borderRadius: '15px' }}>
          
          {/* Section: Profile Overview */}
          <ProfileHeader 
            name={alumni?.name || CONFIG.FALLBACK.NAME}
            batch={alumni?.batch || CONFIG.FALLBACK.BATCH}
            dept={alumni?.dept || CONFIG.FALLBACK.DEPT}
            role={alumni?.currentRole || CONFIG.FALLBACK.ROLE}
            image={alumni?.profilePic || CONFIG.FALLBACK.IMAGE}
          />

          {/* Section: About */}
          <DetailSection title={CONFIG.LABELS.ABOUT}>
            <p className="small text-muted">
              {alumni?.about || CONFIG.FALLBACK.ABOUT_TEXT}
            </p>
          </DetailSection>

          {/* Section: Experience */}
          <DetailSection title={CONFIG.LABELS.EXPERIENCE}>
            <div className="d-flex gap-2">
              <span className="fs-4">💼</span>
              <div>
                <p className="mb-0 fw-bold small">{alumni?.expRole || CONFIG.FALLBACK.EXP_ROLE}</p>
                <p className="text-muted mb-0" style={{ fontSize: '11px' }}>
                  {alumni?.expYear || CONFIG.FALLBACK.EXP_YEAR}
                </p>
              </div>
            </div>
          </DetailSection>

          {/* Section: Education */}
          <DetailSection title={CONFIG.LABELS.EDUCATION}>
            <p className="small mb-0">{alumni?.education || CONFIG.FALLBACK.EDU_DEGREE}</p>
            <p className="text-muted mb-0" style={{ fontSize: '11px' }}>
              {alumni?.batch || CONFIG.FALLBACK.EDU_YEAR}
            </p>
          </DetailSection>

          {/* Section: Actions */}
          <ActionButtons 
            onCancel={() => navigate(-1)}
            onVerify={handleVerify}
            labels={CONFIG.LABELS}
          />

        </div>
      </div>
    </div>
  );
};

export default ReviewApplication;