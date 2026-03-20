import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

/** * CONFIGURATION: Centralized data to avoid hardcoded strings 
 */
const CONFIG = {
  LABELS: {
    PAGE_TITLE: "CREATE UPCOMING EVENT'S",
    TITLE: "EVENT TITLE",
    DATE: "DATE",
    DESCRIPTION: "DESCRIPTION",
    LOCATION: "LOCATION",
    REG_LINKS: "REGISTRATION LINKS",
    ADD_BTN: "+ ADD",
    CANCEL_BTN: "CANCEL",
    POST_BTN: "POST EVENT"
  },
  PLACEHOLDERS: {
    TITLE: "ENTER EVENT TITLE",
    DESCRIPTION: "ENTER DESCRIPTION",
    LOCATION: "ENTER LOCATION",
    LINKS: "PASTE LINKS"
  },
  MESSAGES: {
    VALIDATION_ERROR: "Please fill in all the required fields (Title, Date, Description, and Location)!",
    SUCCESS: "Event Posted Successfully!"
  },
  STORAGE_KEY: 'adminEvents',
  DEFAULT_TYPE: 'Upcoming Event'
};

/** * COMPONENT: FormField
 * Wrapper for Label and Input to maintain consistency
 */
const FormField = ({ label, required = false, children, col = "col-md-5" }) => (
  <div className={col}>
    <label className="fw-bold small mb-2 text-uppercase">
      {label} {required && <span className="text-danger">*</span>}
    </label>
    {children}
  </div>
);

/** * MAIN COMPONENT: CreateEvent
 */
const CreateEvent = () => {
  const navigate = useNavigate();
  
  // State Management
  const [links, setLinks] = useState(['']);
  const [eventData, setEventData] = useState({
    title: '',
    description: '',
    location: '',
    date: ''
  });

  // Dynamic Link Handlers
  const addLinkField = () => setLinks([...links, '']);
  
  const handleLinkChange = (index, value) => {
    const newLinks = [...links];
    newLinks[index] = value;
    setLinks(newLinks);
  };

  /** * LOGIC: handlePostEvent 
   * Validates, cleans data, and saves to LocalStorage
   */
  const handlePostEvent = () => {
    const { title, date, description, location } = eventData;

    // Validation Check
    if (!title.trim() || !date || !description.trim() || !location.trim()) {
      alert(CONFIG.MESSAGES.VALIDATION_ERROR);
      return;
    }

    const existingEvents = JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEY)) || [];
    
    // Remove empty registration links
    const filteredLinks = links.filter(link => link.trim() !== "");

    const newEvent = {
      ...eventData,
      id: Date.now(),
      type: CONFIG.DEFAULT_TYPE,
      regLinks: filteredLinks
    };
    
    localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify([newEvent, ...existingEvents]));
    alert(CONFIG.MESSAGES.SUCCESS);
    navigate('/admin/upcoming-events-list'); 
  };

  return (
    <div style={{ backgroundColor: '#fff', minHeight: '100vh' }}>
      
      <div className="container py-5">
        <h4 className="text-center fw-bold mb-5" style={{ color: '#b22222' }}>
          {CONFIG.LABELS.PAGE_TITLE}
        </h4>
        
        <div className="row g-4 px-lg-5 justify-content-center">
          
          {/* Event Title */}
          <FormField label={CONFIG.LABELS.TITLE} required>
            <input 
              type="text" 
              className="form-control bg-light border-0 p-3 shadow-sm" 
              onChange={(e) => setEventData({...eventData, title: e.target.value})} 
              placeholder={CONFIG.PLACEHOLDERS.TITLE} 
            />
          </FormField>

          {/* Event Date */}
          <FormField label={CONFIG.LABELS.DATE} required>
            <input 
              type="date" 
              className="form-control bg-light border-0 p-3 shadow-sm" 
              onChange={(e) => setEventData({...eventData, date: e.target.value})} 
            />
          </FormField>

          {/* Description */}
          <FormField label={CONFIG.LABELS.DESCRIPTION} required>
            <textarea 
              className="form-control bg-light border-0 p-3 shadow-sm" 
              rows="4" 
              onChange={(e) => setEventData({...eventData, description: e.target.value})} 
              placeholder={CONFIG.PLACEHOLDERS.DESCRIPTION}
            />
          </FormField>

          {/* Location */}
          <FormField label={CONFIG.LABELS.LOCATION} required>
            <input 
              type="text" 
              className="form-control bg-light border-0 p-3 shadow-sm" 
              onChange={(e) => setEventData({...eventData, location: e.target.value})} 
              placeholder={CONFIG.PLACEHOLDERS.LOCATION} 
            />
          </FormField>

          {/* Dynamic Registration Links */}
          <FormField label={CONFIG.LABELS.REG_LINKS} col="col-md-10">
            {links.map((link, index) => (
              <input 
                key={index} 
                type="text" 
                className="form-control bg-light border-0 p-3 mb-2 shadow-sm" 
                value={link} 
                onChange={(e) => handleLinkChange(index, e.target.value)} 
                placeholder={CONFIG.PLACEHOLDERS.LINKS} 
              />
            ))}
            <button 
              className="btn text-primary p-0 small fw-bold border-0 bg-transparent" 
              onClick={addLinkField}
            >
              {CONFIG.LABELS.ADD_BTN}
            </button>
          </FormField>
          
          {/* Action Buttons */}
          <div className="col-12 text-center mt-5">
            <button 
              className="btn text-muted fw-bold me-4 border-0 bg-transparent" 
              onClick={() => navigate('/admin/upcoming-events-list')}
            >
              {CONFIG.LABELS.CANCEL_BTN}
            </button>
            <button 
              className="btn btn-primary px-5 py-2 rounded-pill fw-bold shadow" 
              onClick={handlePostEvent}
            >
              {CONFIG.LABELS.POST_BTN}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default CreateEvent;