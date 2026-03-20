import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

/** * CONFIGURATION: Centralized labels, fallbacks, and content
 */
const CONFIG = {
  LABELS: {
    BACK: "BACK",
    BREADCRUMB: "Admin / Alumni Profile",
    VERIFIED: "Verified",
    DEPT_SUFFIX: " Dept",
    CONTACT_TITLE: " Contact Information",
    ACADEMIC_TITLE: " Academic Details",
    CAREER_TITLE: " Professional Career",
    SKILLS_TITLE: " Skills & Expertise",
    MSG_BTN: " MESSAGE ALUMNI",
    CHAT_TITLE_PREFIX: " Chat with ",
    CHAT_PLACEHOLDER: "Type your message...",
    SEND_BTN: "SEND",
    ERROR_MSG: "No Profile Data!"
  },
  FALLBACK: {
    PHONE: "+91 98765 43210",
    LOCATION: "Chennai, TN, India",
    INSTITUTION: "MAMCET",
    DEGREE: "Bachelor of Engineering",
    EXP: "2+ Years",
    SKILLS: ['React.js', 'Node.js', 'UI/UX Design', 'Database Management', 'Cloud Computing'],
    IMG: "https://via.placeholder.com/120"
  },
  ICONS: {
    BACK: "fas fa-arrow-left",
    CONTACT: "fas fa-info-circle",
    ACADEMIC: "fas fa-graduation-cap",
    CAREER: "fas fa-briefcase",
    SKILLS: "fas fa-lightbulb",
    MSG: "fas fa-comment-dots",
    STATUS: "fas fa-circle"
  }
};

/** * COMPONENT: ProfileCard
 * Renders the top summary card
 */
const ProfileCard = ({ alumni }) => (
  <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: '20px' }}>
    <div className="card-body p-4 text-center">
      <div className="position-relative d-inline-block mb-3">
        <img src={alumni.profilePic || CONFIG.FALLBACK.IMG} className="rounded-circle border border-4 border-white shadow" alt="profile" style={{ width: '130px', height: '130px' }} />
        <span className="position-absolute bottom-0 end-0 bg-success border border-white rounded-circle p-2 shadow-sm" style={{ width: '15px', height: '15px' }}></span>
      </div>
      <h3 className="fw-bold mb-1">{alumni.name}</h3>
      <p className="text-muted mb-2">Hi, I am {alumni.name}. Glad to connect with you!</p>
      <div className="d-flex justify-content-center gap-2">
        <span className="badge bg-danger-subtle text-danger px-3 py-2 rounded-pill border border-danger">{CONFIG.LABELS.VERIFIED}</span>
        <span className="badge bg-primary-subtle text-primary px-3 py-2 rounded-pill border border-primary">{alumni.dept}{CONFIG.LABELS.DEPT_SUFFIX}</span>
      </div>
    </div>
  </div>
);

/** * COMPONENT: InfoBox
 * Reusable component for Contact, Academic, and Career sections
 */
const InfoBox = ({ title, icon, children }) => (
  <div className="col-md-4">
    <div className="card border-0 shadow-sm h-100 p-3" style={{ borderRadius: '15px' }}>
      <h6 className="fw-bold text-danger mb-3"><i className={`${icon} me-2`}></i>{title}</h6>
      {children}
    </div>
  </div>
);

/** * COMPONENT: ChatOverlay
 * Renders the chat window logic and UI
 */
const ChatOverlay = ({ isOpen, onClose, alumni, messages, msgInput, setMsgInput, onSend, chatEndRef }) => {
  if (!isOpen) return null;
  return (
    <div className="position-fixed bottom-0 end-0 m-4 shadow-lg border-0 bg-white" style={{ width: '380px', zIndex: 1060, borderRadius: '20px', overflow: 'hidden' }}>
      <div className="p-3 bg-danger text-white d-flex justify-content-between align-items-center">
        <h6 className="mb-0 fw-bold"><i className={`${CONFIG.ICONS.STATUS} text-success small me-2`}></i>{CONFIG.LABELS.CHAT_TITLE_PREFIX}{alumni.name}</h6>
        <button className="btn-close btn-close-white" onClick={onClose}></button>
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
      <form onSubmit={onSend} className="p-3 border-top bg-white">
        <div className="input-group">
          <input type="text" className="form-control border-0 shadow-none bg-light" placeholder={CONFIG.LABELS.CHAT_PLACEHOLDER} value={msgInput} onChange={(e) => setMsgInput(e.target.value)} style={{ borderRadius: '20px 0 0 20px' }} />
          <button className="btn btn-danger px-4 fw-bold" type="submit" style={{ borderRadius: '0 20px 20px 0' }}>{CONFIG.LABELS.SEND_BTN}</button>
        </div>
      </form>
    </div>
  );
};

/** * MAIN COMPONENT: ViewProfile
 */
const ViewProfile = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const alumni = state?.alumni;

  const [isChatOpen, setIsChatOpen] = useState(false);
  const [msgInput, setMsgInput] = useState("");
  const [messages, setMessages] = useState([]);

  const chatEndRef = useRef(null);

  // Initial Message Setup
  useEffect(() => {
    if (alumni) {
      setMessages([{ id: 1, text: `Hi, I am ${alumni.name}. Glad to connect with you!`, sender: 'alumni', time: '10:00 AM' }]);
    }
  }, [alumni]);

  useEffect(() => {
    if (isChatOpen) chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isChatOpen]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!msgInput.trim()) return;
    const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setMessages([...messages, { id: Date.now(), text: msgInput, sender: 'admin', time: currentTime }]);
    setMsgInput("");
  };

  if (!alumni) return <div className="text-center mt-5"><h4>{CONFIG.LABELS.ERROR_MSG}</h4></div>;

  return (
    <div style={{ backgroundColor: '#f0f2f5', minHeight: '100vh', paddingBottom: '40px' }}>

      <div className="container py-4">
        {/* Navigation Header */}
        <div className="d-flex align-items-center mb-4">
          <button className="btn btn-dark rounded-pill px-4 shadow-sm fw-bold me-3" onClick={() => navigate(-1)}>
            <i className={`${CONFIG.ICONS.BACK} me-2`}></i> {CONFIG.LABELS.BACK}
          </button>
          <h5 className="mb-0 fw-bold text-muted">{CONFIG.LABELS.BREADCRUMB}</h5>
        </div>

        <ProfileCard alumni={alumni} />

        {/* Info Grid */}
        <div className="row g-4">
          <InfoBox title={CONFIG.LABELS.CONTACT_TITLE} icon={CONFIG.ICONS.CONTACT}>
            <p className="small mb-2"><strong>Email:</strong> <br /> {alumni.email}</p>
            <p className="small mb-2"><strong>Phone:</strong> <br /> {CONFIG.FALLBACK.PHONE}</p>
            <p className="small mb-0"><strong>Location:</strong> <br /> {CONFIG.FALLBACK.LOCATION}</p>
          </InfoBox>

          <InfoBox title={CONFIG.LABELS.ACADEMIC_TITLE} icon={CONFIG.ICONS.ACADEMIC}>
            <p className="small mb-2"><strong>Institution:</strong> <br /> {CONFIG.FALLBACK.INSTITUTION}</p>
            <p className="small mb-2"><strong>Batch:</strong> <br /> {alumni.batch} Passed Out</p>
            <p className="small mb-0"><strong>Degree:</strong> <br /> {CONFIG.FALLBACK.DEGREE}</p>
          </InfoBox>

          <InfoBox title={CONFIG.LABELS.CAREER_TITLE} icon={CONFIG.ICONS.CAREER}>
            <p className="small mb-2"><strong>Current Role:</strong> <br /> {alumni.role}</p>
            <p className="small mb-2"><strong>Company:</strong> <br /> {alumni.company}</p>
            <p className="small mb-0"><strong>Experience:</strong> <br /> {CONFIG.FALLBACK.EXP}</p>
          </InfoBox>

          {/* Skills Section */}
          <div className="col-md-12">
            <div className="card border-0 shadow-sm p-4" style={{ borderRadius: '15px' }}>
              <h6 className="fw-bold text-danger mb-3"><i className={`${CONFIG.ICONS.SKILLS} me-2`}></i>{CONFIG.LABELS.SKILLS_TITLE}</h6>
              <div className="d-flex flex-wrap gap-2">
                {(alumni.skills || CONFIG.FALLBACK.SKILLS).map(skill => (
                  <span key={skill} className="badge bg-light text-dark border p-2 px-3 rounded-pill shadow-sm">{skill}</span>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-5 text-center">
          <button className="btn btn-danger rounded-pill px-4 py-2 fw-bold shadow" onClick={() => setIsChatOpen(true)}>
            <i className={`${CONFIG.ICONS.MSG} me-2`}></i> {CONFIG.LABELS.MSG_BTN}
          </button>
        </div>
      </div>

      <ChatOverlay
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        alumni={alumni}
        messages={messages}
        msgInput={msgInput}
        setMsgInput={setMsgInput}
        onSend={handleSend}
        chatEndRef={chatEndRef}
      />
    </div>
  );
};

export default ViewProfile;