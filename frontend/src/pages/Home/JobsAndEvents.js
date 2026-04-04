import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { jobService, eventService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import Modal from '../../components/common/Modal';
import Toast from '../../components/common/Toast';
import { ClipLoader } from 'react-spinners';
import {
  FaBriefcase, FaCalendarAlt, FaMapMarkerAlt, FaClock,
  FaPlus, FaBuilding, FaSearch, FaTimes,
  FaSlidersH, FaChevronDown
} from 'react-icons/fa';
import '../../styles/Opportunities.css';

// ─── Motion preset ────────────────────────────────────────────
const fadeUp = {
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] } },
  exit:    { opacity: 0, y: 8,  transition: { duration: 0.15 } }
};

// ─── Data constants ───────────────────────────────────────────
const JOB_TYPES    = ['All', 'Full-time', 'Part-time', 'Internship', 'Contract', 'Remote'];
const EVENT_TYPES  = ['All', 'Networking', 'Workshop', 'Webinar', 'Seminar', 'Cultural', 'Tech Event', 'Reunion'];
const DEPARTMENTS  = ['All', 'CSE', 'ECE', 'EEE', 'Mechanical', 'Civil', 'IT', 'MBA', 'Other'];
const LOCATIONS    = ['All', 'Remote', 'Bangalore', 'Chennai', 'Hyderabad', 'Mumbai', 'Pune', 'Delhi NCR', 'Coimbatore', 'Trichy'];

// ─── Shared Styles ────────────────────────────────────────────
const accent = '#c84022';
const accentBg = '#fff5f3';
const accentBorder = '#f1c4b8';

const pillBadge = {
  fontSize: 11,
  backgroundColor: accentBg,
  color: accent,
  border: `1px solid ${accentBorder}`,
};

// ══════════════════════════════════════════════════════════════
// FILTER CHIP (reusable)
// ══════════════════════════════════════════════════════════════
const FilterChip = ({ label, value, options, onChange }) => (
  <div className="position-relative">
    <select
      className="form-select form-select-sm rounded-pill pe-4"
      style={{
        fontSize: 12.5,
        borderColor: value !== 'All' ? accent : '#e0e0e0',
        color: value !== 'All' ? accent : '#555',
        backgroundColor: value !== 'All' ? accentBg : '#fff',
        fontWeight: value !== 'All' ? 600 : 400,
        height: 34,
        minWidth: 110,
        paddingLeft: 10,
        cursor: 'pointer',
      }}
      value={value}
      onChange={e => onChange(e.target.value)}
      title={label}
    >
      {options.map(o => (
        <option key={o} value={o}>{o === 'All' ? `${label}: All` : o}</option>
      ))}
    </select>
  </div>
);

// ══════════════════════════════════════════════════════════════
// JOB CARD — List View
// ══════════════════════════════════════════════════════════════
const JobCard = ({ job, onApply, canApply }) => (
  <motion.div
    layout
    variants={fadeUp}
    initial="initial"
    animate="animate"
    exit="exit"
    className="opps-job-card"
    whileHover={{ boxShadow: '0 6px 24px rgba(0,0,0,.08)' }}
  >
    <div className="d-flex flex-column flex-md-row gap-3 align-items-start">
      {/* Company icon */}
      <div
        className="bg-light rounded-3 d-flex align-items-center justify-content-center flex-shrink-0 d-none d-md-flex"
        style={{ width: 56, height: 56 }}
      >
        <FaBuilding style={{ fontSize: 22, color: accent }} />
      </div>

      <div className="flex-grow-1 w-100">
        {/* Title row */}
        <div className="d-flex justify-content-between align-items-start flex-wrap gap-2 mb-1">
          <div className="d-flex align-items-center gap-2">
            <div className="d-flex d-md-none bg-light rounded-2 align-items-center justify-content-center flex-shrink-0"
              style={{ width: 36, height: 36 }}>
              <FaBuilding style={{ fontSize: 14, color: accent }} />
            </div>
            <div>
              <p className="opps-job-card__title">{job.title}</p>
              <p className="opps-job-card__company">{job.company}</p>
            </div>
          </div>
          <span className="badge rounded-pill border fw-normal px-3" style={pillBadge}>
            {job.type}
          </span>
        </div>

        {/* Meta */}
        <div className="d-flex flex-wrap gap-2 mt-2 mb-2" style={{ fontSize: 12, color: '#888' }}>
          <span><FaMapMarkerAlt className="me-1" style={{ color: accent }} />{job.location}</span>
          {job.salary && <span>💰 {job.salary}</span>}
          {job.experience && <span>🎯 {job.experience}</span>}
          {job.department && <span>🏛️ {job.department}</span>}
          {job.timestamp && <span>🕐 {job.timestamp}</span>}
        </div>

        {/* Skills */}
        {(job.skills || []).length > 0 && (
          <div className="d-flex flex-wrap gap-1 mb-3">
            {job.skills.slice(0, 5).map((s, i) => (
              <span key={i} className="badge bg-light text-dark border fw-normal" style={{ fontSize: 10.5 }}>{s}</span>
            ))}
            {job.skills.length > 5 && (
              <span className="badge bg-light text-muted border fw-normal" style={{ fontSize: 10.5 }}>+{job.skills.length - 5}</span>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="d-flex gap-2 flex-wrap">
          {canApply && (
            <button
              className={`btn rounded-pill fw-bold px-4 ${job.applied ? 'btn-success' : 'btn-mamcet-red'}`}
              style={{ fontSize: 12.5, height: 34 }}
              disabled={job.applied}
              onClick={() => onApply(job)}
            >
              {job.applied ? '✓ Applied' : 'Apply Now'}
            </button>
          )}
          <button className="btn btn-outline-secondary rounded-pill px-3 fw-semibold" style={{ fontSize: 12.5, height: 34 }}>
            Save
          </button>
        </div>
      </div>
    </div>
  </motion.div>
);

// ══════════════════════════════════════════════════════════════
// EVENT CARD — Card View
// ══════════════════════════════════════════════════════════════
const EventCard = ({ event, onRegister, onDetail }) => (
  <div
    className="opps-event-card"
    onClick={() => onDetail(event)}
  >
    {/* Image */}
    <div style={{ position: 'relative' }}>
      <img
        src={event.image || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&q=80'}
        alt={event.title}
        className="opps-event-card__image"
        loading="lazy"
      />
      <span
        className="position-absolute top-0 end-0 m-2 badge rounded-pill fw-semibold px-3"
        style={{ fontSize: 10, backgroundColor: 'rgba(200,64,34,.88)', color: '#fff' }}
      >
        {event.category}
      </span>
    </div>

    <div className="opps-event-card__body">
      <h6 className="opps-event-card__title">{event.title}</h6>
      <p className="opps-event-card__desc">{event.desc}</p>
      <div className="opps-event-card__meta">
        {event.date && <span><FaCalendarAlt className="me-1" style={{ color: accent }} />{event.date}</span>}
        {event.time && <span><FaClock className="me-1" style={{ color: accent }} />{event.time}</span>}
        {event.venue && <span><FaMapMarkerAlt className="me-1" style={{ color: accent }} />{event.venue}</span>}
      </div>
      <div className="opps-event-card__actions">
        <button
          className="btn btn-outline-secondary"
          onClick={e => { e.stopPropagation(); onDetail(event); }}
        >
          Details
        </button>
        <button
          className={`btn ${event.registered ? 'btn-success' : 'btn-mamcet-red'}`}
          onClick={e => { e.stopPropagation(); onRegister(event); }}
        >
          {event.registered ? '✓ Registered' : 'Register'}
        </button>
      </div>
    </div>
  </div>
);

// ══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════════
const JobsAndEvents = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  // ── Role flags ────────────────────────────────────────────
  const role      = (user?.role || '').toLowerCase();
  const canCreate = role === 'alumni' || role === 'admin' || role === 'staff';
  const canApply  = role === 'student';

  // Persist tab in URL query
  const params   = new URLSearchParams(location.search);
  const initTab  = params.get('tab') === 'events' ? 'events' : 'jobs';

  const [activeTab,    setActiveTab]    = useState(initTab);
  const [search,       setSearch]       = useState('');
  const [showFilters,  setShowFilters]  = useState(false);
  const [toast,        setToast]        = useState(null);

  // ── JOB FILTERS ───────────────────────────────────────────
  const [jobType,       setJobType]       = useState('All');
  const [jobLocation,   setJobLocation]   = useState('All');
  const [jobDepartment, setJobDepartment] = useState('All');

  // ── EVENT FILTERS ─────────────────────────────────────────
  const [eventCategory, setEventCategory] = useState('All');

  // ── Jobs state ────────────────────────────────────────────
  const [jobs,          setJobs]          = useState([]);
  const [jobsLoading,   setJobsLoading]   = useState(true);
  const [selectedJob,   setSelectedJob]   = useState(null);
  const [applyOpen,     setApplyOpen]     = useState(false);
  const [postOpen,      setPostOpen]      = useState(false);
  const [jobActLoading, setJobActLoading] = useState(false);
  const [newJob,        setNewJob]        = useState({
    title: '', company: '', location: '', type: 'Full-time',
    department: '', experience: '', salary: '', description: '', skills: ''
  });

  // ── Events state ──────────────────────────────────────────
  const [events,          setEvents]          = useState([]);
  const [eventsLoading,   setEventsLoading]   = useState(true);
  const [selectedEvent,   setSelectedEvent]   = useState(null);
  const [registerOpen,    setRegisterOpen]    = useState(false);
  const [detailOpen,      setDetailOpen]      = useState(false);
  const [createOpen,      setCreateOpen]      = useState(false);
  const [evtActLoading,   setEvtActLoading]   = useState(false);
  const [newEvent,        setNewEvent]        = useState({
    title: '', category: 'Networking', date: '', time: '', venue: '', desc: '', image: ''
  });

  const showToast = useCallback((message, type = 'success') => setToast({ message, type }), []);

  // ── Fetch both data sets once ─────────────────────────────
  useEffect(() => {
    jobService.getJobs()
      .then(res => setJobs(res.data.data || []))
      .catch(() => showToast('Failed to load jobs.', 'error'))
      .finally(() => setJobsLoading(false));

    eventService.getEvents()
      .then(res => setEvents(res.data.data || []))
      .catch(() => showToast('Failed to load events.', 'error'))
      .finally(() => setEventsLoading(false));
  }, [showToast]);

  // ── Tab switch updates URL ────────────────────────────────
  const switchTab = (tab) => {
    setActiveTab(tab);
    setSearch('');
    navigate(`?tab=${tab}`, { replace: true });
  };

  // ── Active filters count ──────────────────────────────────
  const activeFilterCount = activeTab === 'jobs'
    ? [jobType, jobLocation, jobDepartment].filter(v => v !== 'All').length
    : [eventCategory].filter(v => v !== 'All').length;

  const clearAllFilters = () => {
    setSearch('');
    if (activeTab === 'jobs') {
      setJobType('All'); setJobLocation('All'); setJobDepartment('All');
    } else {
      setEventCategory('All');
    }
  };

  // ── Filtered lists ───────────────────────────────────────
  const filteredJobs = useMemo(() => {
    const q = search.toLowerCase();
    return jobs.filter(j => {
      const matchType   = jobType === 'All' || (j.type || '').toLowerCase() === jobType.toLowerCase();
      const matchLoc    = jobLocation === 'All' || (j.location || '').toLowerCase().includes(jobLocation.toLowerCase());
      const matchDept   = jobDepartment === 'All' || (j.department || '').toLowerCase().includes(jobDepartment.toLowerCase());
      const matchSearch = !q || j.title?.toLowerCase().includes(q) || j.company?.toLowerCase().includes(q);
      return matchType && matchLoc && matchDept && matchSearch;
    });
  }, [jobs, jobType, jobLocation, jobDepartment, search]);

  const filteredEvents = useMemo(() => {
    const q = search.toLowerCase();
    return events.filter(e => {
      const matchType   = eventCategory === 'All' || (e.category || '').toLowerCase() === eventCategory.toLowerCase();
      const matchSearch = !q || e.title?.toLowerCase().includes(q) || e.venue?.toLowerCase().includes(q);
      return matchType && matchSearch;
    });
  }, [events, eventCategory, search]);

  // ── Job actions ───────────────────────────────────────────
  const handleApply = async (job) => {
    setSelectedJob(job); setApplyOpen(true);
  };
  const submitApply = async () => {
    if (!selectedJob) return;
    setJobActLoading(true);
    try {
      await jobService.applyJob(selectedJob._id || selectedJob.id);
      setJobs(prev => prev.map(j => (j._id === selectedJob._id ? { ...j, applied: true } : j)));
      setApplyOpen(false);
      showToast('Application submitted! 🎉');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to apply.', 'error');
    } finally { setJobActLoading(false); }
  };
  const submitPostJob = async () => {
    if (!newJob.title || !newJob.company) { showToast('Title and company are required.', 'error'); return; }
    setJobActLoading(true);
    try {
      const res = await jobService.createJob(newJob);
      setJobs(prev => [res.data.data, ...prev]);
      setPostOpen(false);
      showToast('Job posted! 🚀');
      setNewJob({ title: '', company: '', location: '', type: 'Full-time', department: '', experience: '', salary: '', description: '', skills: '' });
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to post job.', 'error');
    } finally { setJobActLoading(false); }
  };

  // ── Event actions ─────────────────────────────────────────
  const handleRegister = async () => {
    if (!selectedEvent) return;
    setEvtActLoading(true);
    try {
      const res = await eventService.toggleRegister(selectedEvent._id || selectedEvent.id);
      const updated = res.data.data;
      setEvents(prev => prev.map(e => e._id === selectedEvent._id ? { ...e, registered: updated.registered } : e));
      setRegisterOpen(false); setDetailOpen(false);
      showToast(updated.registered ? 'Registered! 🎉' : 'Registration cancelled.');
    } catch { showToast('Action failed. Try again.', 'error'); }
    finally { setEvtActLoading(false); }
  };
  const submitCreateEvent = async () => {
    if (!newEvent.title || !newEvent.date) { showToast('Title and date are required.', 'error'); return; }
    setEvtActLoading(true);
    try {
      const res = await eventService.createEvent(newEvent);
      setEvents(prev => [res.data.data, ...prev]);
      setCreateOpen(false);
      showToast('Event created! 🎊');
      setNewEvent({ title: '', category: 'Networking', date: '', time: '', venue: '', desc: '', image: '' });
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to create event.', 'error');
    } finally { setEvtActLoading(false); }
  };

  const isLoading = activeTab === 'jobs' ? jobsLoading : eventsLoading;

  // ════════════════════════════════════════════════════════════
  return (
    <div className="opps-page">
      <div className="opps-container">

        {/* ── Header Row ──────────────────────────────── */}
        <div className="opps-header">
          <div>
            <h2 className="opps-header__title">
              {activeTab === 'jobs' ? '💼 Job Opportunities' : '🎉 Alumni Events'}
            </h2>
            <p className="opps-header__subtitle">
              {activeTab === 'jobs'
                ? 'Explore roles shared by your alumni network'
                : 'Discover upcoming events and networking opportunities'}
            </p>
          </div>

          {/* CTA — only alumni/admin can create */}
          {canCreate && (
            <button
              className="btn btn-mamcet-red opps-header__cta d-flex align-items-center gap-2"
              onClick={() => activeTab === 'jobs' ? setPostOpen(true) : setCreateOpen(true)}
            >
              <FaPlus size={11} />
              {activeTab === 'jobs' ? 'Post a Job' : 'Create Event'}
            </button>
          )}
        </div>

        {/* ── Tab Toggle ─────────────────────────────── */}
        <div className="d-flex align-items-center gap-3 mb-3">
          <div className="bg-white rounded-pill shadow-sm border-0 p-1 d-inline-flex gap-1">
            {[
              { key: 'jobs',   label: 'Jobs',   icon: <FaBriefcase size={13} className="me-1" /> },
              { key: 'events', label: 'Events', icon: <FaCalendarAlt size={13} className="me-1" /> }
            ].map(({ key, label, icon }) => (
              <button
                key={key}
                onClick={() => switchTab(key)}
                className="btn rounded-pill fw-bold px-3 px-md-4 d-flex align-items-center"
                style={{
                  fontSize: 13,
                  height: 36,
                  backgroundColor: activeTab === key ? accent : 'transparent',
                  color: activeTab === key ? '#fff' : '#666',
                  transition: 'all 0.2s',
                  minWidth: 90,
                  justifyContent: 'center',
                }}
              >
                {icon}{label}
              </button>
            ))}
          </div>

          {/* Result count */}
          <span className="text-muted d-none d-md-inline" style={{ fontSize: 12.5 }}>
            {activeTab === 'jobs'
              ? `${filteredJobs.length} job${filteredJobs.length !== 1 ? 's' : ''}`
              : `${filteredEvents.length} event${filteredEvents.length !== 1 ? 's' : ''}`
            }
          </span>
        </div>

        {/* ── Search + Filter Bar ────────────────────── */}
        <div className="opps-search-bar">
          <div className="opps-search-row">
            {/* Search */}
            <div className="opps-search-input-wrap">
              <FaSearch className="opps-search-icon" />
              <input
                type="text"
                className="form-control"
                placeholder={activeTab === 'jobs' ? 'Search jobs, companies…' : 'Search events, venues…'}
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>

            {/* Filter toggle button */}
            <button
              className={`btn opps-filter-btn d-flex align-items-center gap-1 ${showFilters || activeFilterCount > 0 ? 'btn-mamcet-red' : 'btn-outline-secondary'}`}
              onClick={() => setShowFilters(!showFilters)}
            >
              <FaSlidersH size={12} />
              Filters
              {activeFilterCount > 0 && (
                <span className="badge rounded-pill bg-white text-danger ms-1" style={{ fontSize: 10 }}>{activeFilterCount}</span>
              )}
              <FaChevronDown size={9} style={{ transform: showFilters ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }} />
            </button>

            {/* Clear all */}
            {(activeFilterCount > 0 || search) && (
              <button
                className="btn btn-link text-muted p-0 d-flex align-items-center gap-1"
                style={{ fontSize: 12, textDecoration: 'none' }}
                onClick={clearAllFilters}
              >
                <FaTimes size={10} /> Clear
              </button>
            )}
          </div>

          {/* ── Expandable Filter Row ─────────────────── */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                style={{ overflow: 'hidden' }}
              >
                <div className="opps-filter-row">
                  {activeTab === 'jobs' ? (
                    <>
                      <FilterChip label="Type" value={jobType} options={JOB_TYPES} onChange={setJobType} />
                      <FilterChip label="Location" value={jobLocation} options={LOCATIONS} onChange={setJobLocation} />
                      <FilterChip label="Department" value={jobDepartment} options={DEPARTMENTS} onChange={setJobDepartment} />
                    </>
                  ) : (
                    <>
                      <FilterChip label="Category" value={eventCategory} options={EVENT_TYPES} onChange={setEventCategory} />
                    </>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Mobile result count ────────────────────── */}
        <p className="text-muted d-md-none mb-2" style={{ fontSize: 12 }}>
          {activeTab === 'jobs'
            ? `${filteredJobs.length} result${filteredJobs.length !== 1 ? 's' : ''}`
            : `${filteredEvents.length} result${filteredEvents.length !== 1 ? 's' : ''}`}
        </p>

        {/* ── Content ────────────────────────────────── */}
        {isLoading ? (
          <div className="d-flex justify-content-center py-5">
            <ClipLoader color={accent} size={40} />
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {/* ── JOBS tab ─ list view ────────────────── */}
            {activeTab === 'jobs' && (
              <motion.div key="jobs" variants={fadeUp} initial="initial" animate="animate" exit="exit">
                {filteredJobs.length === 0 ? (
                  <div className="opps-empty">
                    <FaBriefcase size={40} className="text-muted mb-3 opacity-25" />
                    <p className="text-muted fw-semibold">
                      {search || activeFilterCount > 0
                        ? 'No jobs match your filters.'
                        : 'No job postings yet. Be the first to post one!'}
                    </p>
                    {(search || activeFilterCount > 0) && (
                      <button className="btn btn-outline-secondary btn-sm rounded-pill px-4 mt-2" onClick={clearAllFilters}>
                        Clear Filters
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="opps-jobs-list">
                    <AnimatePresence>
                      {filteredJobs.map(job => (
                        <JobCard key={job._id || job.id} job={job} onApply={handleApply} canApply={canApply} />
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </motion.div>
            )}

            {/* ── EVENTS tab ─ card grid ──────────────── */}
            {activeTab === 'events' && (
              <motion.div key="events" variants={fadeUp} initial="initial" animate="animate" exit="exit">
                {filteredEvents.length === 0 ? (
                  <div className="opps-empty">
                    <FaCalendarAlt size={40} className="text-muted mb-3 opacity-25" />
                    <p className="text-muted fw-semibold">
                      {search || activeFilterCount > 0
                        ? 'No events match your filters.'
                        : 'No events yet. Create the first one!'}
                    </p>
                    {(search || activeFilterCount > 0) && (
                      <button className="btn btn-outline-secondary btn-sm rounded-pill px-4 mt-2" onClick={clearAllFilters}>
                        Clear Filters
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="opps-events-grid">
                    <AnimatePresence>
                      {filteredEvents.map(event => (
                        <EventCard
                          key={event._id || event.id}
                          event={event}
                          onRegister={e => { setSelectedEvent(e); setRegisterOpen(true); }}
                          onDetail={e => { setSelectedEvent(e); setDetailOpen(true); }}
                        />
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════
          MODALS
        ══════════════════════════════════════════════════════ */}

      {/* Apply to Job */}
      <Modal isOpen={applyOpen} onClose={() => setApplyOpen(false)} title="Apply for Position"
        footer={
          <button className="btn btn-mamcet-red px-4 rounded-pill fw-bold d-flex align-items-center gap-2"
            onClick={submitApply} disabled={jobActLoading}>
            {jobActLoading && <ClipLoader size={14} color="#fff" />} Submit Application
          </button>
        }>
        <div className="p-3 bg-light rounded-3 mb-4">
          <h6 className="fw-bold mb-1">{selectedJob?.title}</h6>
          <p className="extra-small text-muted mb-0">{selectedJob?.company} &bull; {selectedJob?.location}</p>
        </div>
        <label className="form-label extra-small fw-bold">Cover Letter / Note</label>
        <textarea className="form-control" rows={4} placeholder="Briefly mention why you are a good fit…" />
        <p className="extra-small text-muted mt-2">Your profile will be shared with the recruiter automatically.</p>
      </Modal>

      {/* Post a Job */}
      <Modal isOpen={postOpen} onClose={() => setPostOpen(false)} title="Post a New Job Opening"
        footer={
          <button className="btn btn-mamcet-red px-4 rounded-pill fw-bold d-flex align-items-center gap-2"
            onClick={submitPostJob} disabled={jobActLoading}>
            {jobActLoading && <ClipLoader size={14} color="#fff" />} Publish Job
          </button>
        }>
        <div className="row g-3">
          <div className="col-md-7"><label className="form-label extra-small fw-bold">Job Title</label>
            <input type="text" className="form-control" value={newJob.title} onChange={e => setNewJob({ ...newJob, title: e.target.value })} /></div>
          <div className="col-md-5"><label className="form-label extra-small fw-bold">Company</label>
            <input type="text" className="form-control" value={newJob.company} onChange={e => setNewJob({ ...newJob, company: e.target.value })} /></div>
          <div className="col-md-6"><label className="form-label extra-small fw-bold">Location</label>
            <input type="text" className="form-control" placeholder="e.g. Bangalore, Remote" value={newJob.location} onChange={e => setNewJob({ ...newJob, location: e.target.value })} /></div>
          <div className="col-md-6"><label className="form-label extra-small fw-bold">Job Type</label>
            <select className="form-select" value={newJob.type} onChange={e => setNewJob({ ...newJob, type: e.target.value })}>
              {JOB_TYPES.filter(t => t !== 'All').map(t => <option key={t}>{t}</option>)}
            </select></div>
          <div className="col-md-6"><label className="form-label extra-small fw-bold">Department</label>
            <select className="form-select" value={newJob.department} onChange={e => setNewJob({ ...newJob, department: e.target.value })}>
              <option value="">Select Department</option>
              {DEPARTMENTS.filter(d => d !== 'All').map(d => <option key={d}>{d}</option>)}
            </select></div>
          <div className="col-md-6"><label className="form-label extra-small fw-bold">Experience</label>
            <input type="text" className="form-control" placeholder="e.g. 2-5 Years" value={newJob.experience} onChange={e => setNewJob({ ...newJob, experience: e.target.value })} /></div>
          <div className="col-md-6"><label className="form-label extra-small fw-bold">Salary Range</label>
            <input type="text" className="form-control" placeholder="e.g. 10-15 LPA" value={newJob.salary} onChange={e => setNewJob({ ...newJob, salary: e.target.value })} /></div>
          <div className="col-md-6"><label className="form-label extra-small fw-bold">Skills (comma-separated)</label>
            <input type="text" className="form-control" placeholder="React, Node.js, Python" value={newJob.skills} onChange={e => setNewJob({ ...newJob, skills: e.target.value })} /></div>
          <div className="col-12"><label className="form-label extra-small fw-bold">Description</label>
            <textarea className="form-control" rows={3} value={newJob.description} onChange={e => setNewJob({ ...newJob, description: e.target.value })} /></div>
        </div>
      </Modal>

      {/* Event Detail */}
      <Modal isOpen={detailOpen} onClose={() => setDetailOpen(false)} title="Event Details">
        {selectedEvent && (
          <div>
            {selectedEvent.image && <img src={selectedEvent.image} alt={selectedEvent.title} className="w-100 rounded-3 mb-4 shadow-sm" style={{ maxHeight: 220, objectFit: 'cover' }} />}
            <h4 className="fw-bold text-dark mb-2">{selectedEvent.title}</h4>
            <div className="d-flex gap-3 mb-3 flex-wrap extra-small fw-bold text-muted">
              <span><FaCalendarAlt className="me-1" style={{ color: accent }} />{selectedEvent.date}</span>
              <span><FaClock className="me-1" style={{ color: accent }} />{selectedEvent.time}</span>
              <span className="badge rounded-pill px-3" style={pillBadge}>{selectedEvent.category}</span>
            </div>
            <p className="text-muted mb-3">{selectedEvent.desc}</p>
            {selectedEvent.venue && (
              <div className="p-3 bg-light rounded-3 d-flex align-items-center gap-2">
                <FaMapMarkerAlt style={{ color: accent, fontSize: 20 }} />
                <div><p className="mb-0 extra-small text-muted">{selectedEvent.venue}</p></div>
              </div>
            )}
            <button
              className={`btn w-100 mt-3 rounded-pill fw-bold ${selectedEvent.registered ? 'btn-outline-danger' : 'btn-mamcet-red'}`}
              onClick={() => { setDetailOpen(false); setRegisterOpen(true); }}
            >
              {selectedEvent.registered ? 'Cancel Registration' : 'Register Now'}
            </button>
          </div>
        )}
      </Modal>

      {/* Register / Cancel */}
      <Modal isOpen={registerOpen} onClose={() => setRegisterOpen(false)}
        title={selectedEvent?.registered ? 'Cancel Registration' : 'Confirm Registration'}
        footer={
          <button
            className={`btn px-4 rounded-pill fw-bold d-flex align-items-center gap-2 ${selectedEvent?.registered ? 'btn-outline-danger' : 'btn-mamcet-red'}`}
            onClick={handleRegister} disabled={evtActLoading}>
            {evtActLoading && <ClipLoader size={14} color="#fff" />}
            {selectedEvent?.registered ? 'Yes, Cancel' : 'Yes, Register Me'}
          </button>
        }>
        <p className="text-muted">{selectedEvent?.registered ? 'Are you sure you want to cancel?' : 'You will be registered for:'}</p>
        <div className="p-3 bg-light rounded-3">
          <h6 className="fw-bold mb-1 small">{selectedEvent?.title}</h6>
          <p className="extra-small text-muted mb-0">{selectedEvent?.date} &bull; {selectedEvent?.time}</p>
        </div>
      </Modal>

      {/* Create Event */}
      <Modal isOpen={createOpen} onClose={() => setCreateOpen(false)} title="Create New Event"
        footer={
          <button className="btn btn-mamcet-red px-4 rounded-pill fw-bold d-flex align-items-center gap-2"
            onClick={submitCreateEvent} disabled={evtActLoading}>
            {evtActLoading && <ClipLoader size={14} color="#fff" />} Publish Event
          </button>
        }>
        <div className="row g-3">
          <div className="col-12"><label className="form-label extra-small fw-bold">Event Title</label>
            <input type="text" className="form-control" value={newEvent.title} onChange={e => setNewEvent({ ...newEvent, title: e.target.value })} /></div>
          <div className="col-md-6"><label className="form-label extra-small fw-bold">Category</label>
            <select className="form-select" value={newEvent.category} onChange={e => setNewEvent({ ...newEvent, category: e.target.value })}>
              {EVENT_TYPES.filter(t => t !== 'All').map(t => <option key={t}>{t}</option>)}
            </select></div>
          <div className="col-md-6"><label className="form-label extra-small fw-bold">Image URL</label>
            <input type="text" className="form-control" placeholder="https://…" value={newEvent.image} onChange={e => setNewEvent({ ...newEvent, image: e.target.value })} /></div>
          <div className="col-md-6"><label className="form-label extra-small fw-bold">Date</label>
            <input type="date" className="form-control" value={newEvent.date} onChange={e => setNewEvent({ ...newEvent, date: e.target.value })} /></div>
          <div className="col-md-6"><label className="form-label extra-small fw-bold">Time</label>
            <input type="time" className="form-control" value={newEvent.time} onChange={e => setNewEvent({ ...newEvent, time: e.target.value })} /></div>
          <div className="col-12"><label className="form-label extra-small fw-bold">Venue</label>
            <input type="text" className="form-control" value={newEvent.venue} onChange={e => setNewEvent({ ...newEvent, venue: e.target.value })} /></div>
          <div className="col-12"><label className="form-label extra-small fw-bold">Description</label>
            <textarea className="form-control" rows={3} value={newEvent.desc} onChange={e => setNewEvent({ ...newEvent, desc: e.target.value })} /></div>
        </div>
      </Modal>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};

export default JobsAndEvents;
