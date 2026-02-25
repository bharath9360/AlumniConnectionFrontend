import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import AdminNavbar from '../../components/admin/AdminNavbar';

/** * CONFIGURATION: Centralized text and fallback data 
 */
const CONFIG = {
  LABELS: {
    MAIN_TITLE: "SUCCESSFULLY VERIFIED",
    SUB_TITLE: "ADDED AS MAMCET ALUMNI",
    BADGE_ICON: "🏅",
    BACK_BTN: "Go Back to Management",
    PREFIX_COMPANY: "at "
  },
  FALLBACK: {
    NAME: "Hari Laksminarayana",
    ROLE: "UI/UX Designer",
    COMPANY: "Google",
    IMAGE: "https://img.freepik.com/free-vector/businessman-character-avatar-isolated_24877-60111.jpg"
  },
  STORAGE_KEY: 'alumniData',
  NAVIGATE_PATH: '/admin/alumni',
  VERIFIED_STATUS: 'Verified'
};

/** * COMPONENT: SuccessHeader 
 * Renders the top icon and success message
 */
const SuccessHeader = ({ icon, title, subtitle }) => (
  <div className="animate__animated animate__zoomIn">
    <div className="mb-3 display-2 text-warning">{icon}</div>
    <h3 className="fw-bold mb-1" style={{ letterSpacing: '1px' }}>{title}</h3>
    <p className="text-muted small fw-bold">{subtitle}</p>
  </div>
);

/** * COMPONENT: UserBadge 
 * Renders the verified user's card details
 */
const UserBadge = ({ alumni, config }) => (
  <div className="mt-5 mb-5 p-4 border rounded shadow-sm d-inline-block bg-light" style={{ minWidth: '300px' }}>
    <img 
      src={alumni?.profilePic || config.FALLBACK.IMAGE} 
      className="rounded-circle border border-primary p-1" 
      width="90" height="90" alt="profile" 
    />
    <h5 className="fw-bold mt-3 text-uppercase">
      {alumni?.name || config.FALLBACK.NAME}
    </h5>
    <p className="text-primary small fw-bold mb-0">
      {alumni?.role || config.FALLBACK.ROLE}
    </p>
    <p className="text-muted extra-small">
      {config.LABELS.PREFIX_COMPANY} {alumni?.company || config.FALLBACK.COMPANY}
    </p>
  </div>
);

/** * COMPONENT: ActionButtons 
 * Renders the navigation button
 */
const ActionButtons = ({ onClick, label }) => (
  <>
    <br />
    <button className="btn btn-primary rounded-pill px-5 py-2 fw-bold shadow-lg" onClick={onClick}>
      {label}
    </button>
  </>
);

/** * MAIN COMPONENT: VerificationSuccess
 */
const VerificationSuccess = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const alumni = state?.alumni;

  /** * Logic: handleGoBack 
   * Updates the alumni status in localStorage before navigating
   */
  const handleGoBack = () => {
    const existingData = JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEY)) || [];
    
    const updatedData = existingData.map(item => 
      item.id === alumni?.id ? { ...item, status: CONFIG.VERIFIED_STATUS } : item
    );
    
    localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(updatedData));
    navigate(CONFIG.NAVIGATE_PATH);
  };

  return (
    <div style={{ backgroundColor: '#fff', minHeight: '100vh' }}>
      <AdminNavbar />
      
      <div className="container py-5 text-center">
        <div className="mt-5">
          
          <SuccessHeader 
            icon={CONFIG.LABELS.BADGE_ICON}
            title={CONFIG.LABELS.MAIN_TITLE}
            subtitle={CONFIG.LABELS.SUB_TITLE}
          />
          
          <UserBadge 
            alumni={alumni} 
            config={CONFIG} 
          />
          
          <ActionButtons 
            onClick={handleGoBack} 
            label={CONFIG.LABELS.BACK_BTN} 
          />
          
        </div>
      </div>
    </div>
  );
};

export default VerificationSuccess;