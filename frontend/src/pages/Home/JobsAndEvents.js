import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { jobService, eventService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import Modal from '../../components/common/Modal';
import Toast from '../../components/common/Toast';
import { ClipLoader } from 'react-spinners';
import {
  FaBriefcase, FaCalendarAlt, FaMapMarkerAlt, FaClock,
  FaPlus, FaFilter, FaBuilding, FaSearch
} from 'react-icons/fa';

// ─── Motion preset ────────────────────────────────────────────
const fadeUp = {
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] } },
  exit:    { opacity: 0, y: 8,  transition: { duration: 0.15 } }
};

// ─── Data constants ───────────────────────────────────────────
const JOB_TYPES   = ['All', 'Full-time', 'Part-time', 'Internship', 'Contract', 'Remote'];
const EVENT_TYPES = ['All', 'Networking', 'Workshop', 'Webinar', 'Seminar', 'Cultural', 'Tech Event', 'Reunion'];

// ══════════════════════════════════════════════════════════════
// JOB CARD
// ══════════════════════════════════════════════════════════════
const JobCard = ({ job, onApply, canApply, canPost }) => (
  <motion.div
    layout
    variants={fadeUp}
    initial="initial"
    animate="animate"
    exit="exit"
    className="bg-white rounded-4 shadow-sm border-0 p-4 mb-3 d-flex flex-column flex-md-row gap-3 align-items-start"
    style={{ transition: 'box-shadow .18s' }}
    onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,.10)'}
    onMouseLeave={e => e.currentTarget.style.boxShadow = ''}
  >
    {/* Company icon */}
    <div
      className="bg-light rounded-3 d-flex align-items-center justify-content-center flex-shrink-0"
      style={{ width: 64, height: 64 }}
    >
      <FaBuilding style={{ fontSize: 26, color: '#c84022' }} />
    </div>

    <div className="flex-grow-1">
      <div className="d-flex justify-content-between align-items-start flex-wrap gap-2 mb-1">
        <h5 className="fw-bold text-dark mb-0">{job.title}</h5>
        <span className="badge rounded-pill border fw-normal px-3"
          style={{ fontSize: 11, backgroundColor: '#fff5f3', color: '#c84022', border: '1px solid #f1c4b8' }}>
          {job.type}
        </span>
      </div>
      <p className="fw-semibold text-muted mb-1" style={{ fontSize: 14 }}>{job.company}</p>
      <p className="extra-small text-muted mb-2">
        <FaMapMarkerAlt className="me-1" style={{ color: '#c84022' }} />{job.location}
        {job.salary && <> &bull; 💰 {job.salary}</>}
        {job.experience && <> &bull; 🎯 {job.experience}</>}
      </p>

      {(job.skills || []).length > 0 && (
        <div className="d-flex flex-wrap gap-2 mb-3">
          {job.skills.map((s, i) => (
            <span key={i} className="badge bg-light text-dark border fw-normal" style={{ fontSize: 11 }}>{s}</span>
          ))}
        </div>
      )}

      <div className="d-flex gap-2 flex-wrap">
        {/* Only students can apply */}
        {canApply && (
          <button
            className={`btn rounded-pill fw-bold px-4 ${job.applied ? 'btn-success' : 'btn-mamcet-red'}`}
            style={{ fontSize: 13 }}
            disabled={job.applied}
            onClick={() => onApply(job)}
          >
            {job.applied ? '✓ Applied' : 'Apply Now'}
          </button>
        )}
        <button className="btn btn-outline-secondary rounded-pill px-4 fw-semibold" style={{ fontSize: 13 }}>
          Save
        </button>
      </div>
    </div>
  </motion.div>
);

// ══════════════════════════════════════════════════════════════
// EVENT CARD
// ══════════════════════════════════════════════════════════════
const EventCard = ({ event, onRegister, onDetail }) => (
  <motion.div
    layout
    variants={fadeUp}
    initial="initial"
    animate="animate"
    exit="exit"
    className="col-md-6 col-xl-4"
  >
    <div
      className="bg-white rounded-4 shadow-sm border-0 overflow-hidden h-100 d-flex flex-column"
      style={{ transition: 'box-shadow .18s' }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,.10)'}
      onMouseLeave={e => e.currentTarget.style.boxShadow = ''}
    >
      {/* Image */}
      <div style={{ height: 160, overflow: 'hidden', position: 'relative' }}>
        <img
          src={event.image || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&q=80'}
          alt={event.title}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
        <span
          className="position-absolute top-0 end-0 m-2 badge rounded-pill fw-semibold px-3"
          style={{ fontSize: 10, backgroundColor: 'rgba(200,64,34,.88)', color: '#fff' }}
        >
          {event.category}
        </span>
      </div>

      <div className="p-4 flex-grow-1 d-flex flex-column">
        <h6 className="fw-bold text-dark mb-2" style={{ lineHeight: 1.35 }}>{event.title}</h6>
        <p className="extra-small text-muted flex-grow-1 mb-3">
          {event.desc?.substring(0, 90)}{event.desc?.length > 90 ? '…' : ''}
        </p>
        <div className="extra-small text-muted mb-3 d-flex flex-column gap-1">
          {event.date && <span><FaCalendarAlt className="me-1" style={{ color: '#c84022' }} />{event.date}</span>}
          {event.time && <span><FaClock className="me-1" style={{ color: '#c84022' }} />{event.time}</span>}
          {event.venue && <span><FaMapMarkerAlt className="me-1" style={{ color: '#c84022' }} />{event.venue}</span>}
        </div>
        <div className="d-flex gap-2">
          <button className="btn btn-outline-secondary rounded-pill btn-sm px-3 fw-semibold" onClick={() => onDetail(event)}>
            Details
          </button>
          <button
            className={`btn rounded-pill btn-sm px-3 fw-bold ${event.registered ? 'btn-success' : 'btn-mamcet-red'}`}
            onClick={() => onRegister(event)}
          >
            {event.registered ? '✓ Registered' : 'Register'}
          </button>
        </div>
      </div>
    </div>
  </motion.div>
);

// ══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════════
const JobsAndEvents = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  // ── Role flags ────────────────────────────────────────────────
  const role      = (user?.role || '').toLowerCase();
  const canCreate = role === 'alumni' || role === 'admin';  // can post jobs / create events
  const canApply  = role === 'student';                     // can apply to jobs

  // Persist tab in URL query: /opportunities?tab=events
  const params   = new URLSearchParams(location.search);
  const initTab  = params.get('tab') === 'events' ? 'events' : 'jobs';

  const [activeTab,   setActiveTab]   = useState(initTab);
  const [jobFilter,   setJobFilter]   = useState('All');
  const [eventFilter, setEventFilter] = useState('All');
  const [search,      setSearch]      = useState('');
  const [toast,       setToast]       = useState(null);

  // ── Jobs state ───────────────────────────────────────────────
  const [jobs,          setJobs]          = useState([]);
  const [jobsLoading,   setJobsLoading]   = useState(true);
  const [selectedJob,   setSelectedJob]   = useState(null);
  const [applyOpen,     setApplyOpen]     = useState(false);
  const [postOpen,      setPostOpen]      = useState(false);
  const [jobActLoading, setJobActLoading] = useState(false);
  const [newJob,        setNewJob]        = useState({
    title: '', company: '', location: '', type: 'Full-time',
    experience: '', salary: '', description: '', skills: ''
  });

  // ── Events state ─────────────────────────────────────────────
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

  const showToast = (message, type = 'success') => setToast({ message, type });

  // ── Fetch both data sets once ─────────────────────────────────
  useEffect(() => {
    jobService.getJobs()
      .then(res => setJobs(res.data.data || []))
      .catch(() => showToast('Failed to load jobs.', 'error'))
      .finally(() => setJobsLoading(false));

    eventService.getEvents()
      .then(res => setEvents(res.data.data || []))
      .catch(() => showToast('Failed to load events.', 'error'))
      .finally(() => setEventsLoading(false));
  }, []);

  // ── Tab switch updates URL ────────────────────────────────────
  const switchTab = (tab) => {
    setActiveTab(tab);
    setSearch('');
    navigate(`?tab=${tab}`, { replace: true });
  };

  // ── Filtered lists ───────────────────────────────────────────
  const filteredJobs = useMemo(() => {
    const q = search.toLowerCase();
    return jobs.filter(j => {
      const matchType   = jobFilter === 'All' || (j.type || '').toLowerCase() === jobFilter.toLowerCase();
      const matchSearch = !q || j.title?.toLowerCase().includes(q) || j.company?.toLowerCase().includes(q);
      return matchType && matchSearch;
    });
  }, [jobs, jobFilter, search]);

  const filteredEvents = useMemo(() => {
    const q = search.toLowerCase();
    return events.filter(e => {
      const matchType   = eventFilter === 'All' || (e.category || '').toLowerCase() === eventFilter.toLowerCase();
      const matchSearch = !q || e.title?.toLowerCase().includes(q) || e.venue?.toLowerCase().includes(q);
      return matchType && matchSearch;
    });
  }, [events, eventFilter, search]);

  // ── Job actions ───────────────────────────────────────────────
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
      setNewJob({ title: '', company: '', location: '', type: 'Full-time', experience: '', salary: '', description: '', skills: '' });
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to post job.', 'error');
    } finally { setJobActLoading(false); }
  };

  // ── Event actions ─────────────────────────────────────────────
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
    <div className="dashboard-main-bg min-vh-100 py-4">
      <div className="container">

        {/* ── Page header ─────────────────────────────────── */}
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
          <div>
            <h2 className="fw-bold mb-0 text-dark" style={{ fontSize: 'clamp(1.3rem,4vw,1.8rem)' }}>
              {activeTab === 'jobs' ? '💼 Job Opportunities' : '🎉 Alumni Events'}
            </h2>
            <p className="text-muted mb-0 small">
              {activeTab === 'jobs'
                ? 'Explore roles shared by your alumni network'
                : 'Discover upcoming events and networking opportunities'}
            </p>
          </div>

          {/* CTA button — only alumni/admin can create */}
          {canCreate && (
            activeTab === 'jobs' ? (
              <button
                className="btn btn-mamcet-red rounded-pill px-4 fw-bold d-flex align-items-center gap-2 w-auto flex-shrink-0"
                onClick={() => setPostOpen(true)}
              >
                <FaPlus size={12} /> Post a Job
              </button>
            ) : (
              <button
                className="btn btn-mamcet-red rounded-pill px-4 fw-bold d-flex align-items-center gap-2 w-auto flex-shrink-0"
                onClick={() => setCreateOpen(true)}
              >
                <FaPlus size={12} /> Create Event
              </button>
            )
          )}
        </div>

        {/* ── Tab toggle ──────────────────────────────────── */}
        <div className="bg-white rounded-4 shadow-sm border-0 p-2 mb-4 d-inline-flex gap-1">
          {[
            { key: 'jobs',   label: 'Jobs',   icon: <FaBriefcase className="me-2" /> },
            { key: 'events', label: 'Events', icon: <FaCalendarAlt className="me-2" /> }
          ].map(({ key, label, icon }) => (
            <button
              key={key}
              onClick={() => switchTab(key)}
              className="btn rounded-3 fw-bold px-4"
              style={{
                fontSize: 14,
                backgroundColor: activeTab === key ? '#c84022' : 'transparent',
                color: activeTab === key ? '#fff' : '#555',
                transition: 'all 0.2s',
                minWidth: 110,
              }}
            >
              {icon}{label}
            </button>
          ))}
        </div>

        {/* ── Search + Filter bar ──────────────────────────── */}
        <div className="d-flex flex-wrap gap-2 mb-4">
          {/* Search */}
          <div className="position-relative flex-grow-1" style={{ minWidth: 220 }}>
            <FaSearch className="position-absolute text-muted" style={{ left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', fontSize: 13 }} />
            <input
              type="text"
              className="form-control rounded-pill ps-4"
              placeholder={activeTab === 'jobs' ? 'Search jobs or companies…' : 'Search events or venues…'}
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ fontSize: 13, borderColor: '#e0e0e0', height: 38 }}
            />
          </div>

          {/* Type filter */}
          <div className="d-flex align-items-center gap-2">
            <FaFilter style={{ color: '#c84022', fontSize: 13 }} />
            <select
              className="form-select form-select-sm rounded-pill"
              style={{ fontSize: 13, borderColor: '#e0e0e0', minWidth: 140, height: 38 }}
              value={activeTab === 'jobs' ? jobFilter : eventFilter}
              onChange={e => activeTab === 'jobs' ? setJobFilter(e.target.value) : setEventFilter(e.target.value)}
            >
              {(activeTab === 'jobs' ? JOB_TYPES : EVENT_TYPES).map(t => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </div>
        </div>

        {/* ── Content ─────────────────────────────────────── */}
        {isLoading ? (
          <div className="d-flex justify-content-center py-5">
            <ClipLoader color="#c84022" size={44} />
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {/* ── JOBS tab ─────────────────────────────────── */}
            {activeTab === 'jobs' && (
              <motion.div key="jobs" variants={fadeUp} initial="initial" animate="animate" exit="exit">
                {filteredJobs.length === 0 ? (
                  <div className="text-center py-5 bg-white rounded-4 shadow-sm">
                    <FaBriefcase size={40} className="text-muted mb-3 opacity-25" />
                    <p className="text-muted fw-semibold">
                      {search || jobFilter !== 'All' ? 'No jobs match your filters.' : 'No job postings yet. Be the first to post one!'}
                    </p>
                  </div>
                ) : (
                  <div style={{ maxWidth: 780, margin: '0 auto' }}>
                    <p className="extra-small text-muted mb-3">{filteredJobs.length} result{filteredJobs.length !== 1 ? 's' : ''}</p>
                    <AnimatePresence>
                      {filteredJobs.map(job => (
                        <JobCard key={job._id || job.id} job={job} onApply={handleApply} canApply={canApply} />
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </motion.div>
            )}

            {/* ── EVENTS tab ───────────────────────────────── */}
            {activeTab === 'events' && (
              <motion.div key="events" variants={fadeUp} initial="initial" animate="animate" exit="exit">
                {filteredEvents.length === 0 ? (
                  <div className="text-center py-5 bg-white rounded-4 shadow-sm">
                    <FaCalendarAlt size={40} className="text-muted mb-3 opacity-25" />
                    <p className="text-muted fw-semibold">
                      {search || eventFilter !== 'All' ? 'No events match your filters.' : 'No events yet. Create the first one!'}
                    </p>
                  </div>
                ) : (
                  <>
                    <p className="extra-small text-muted mb-3">{filteredEvents.length} result{filteredEvents.length !== 1 ? 's' : ''}</p>
                    <div className="row g-4">
                      <AnimatePresence>
                        {filteredEvents.map(event => (
                          <EventCard
                            key={event._id || event.id}
                            event={event}
                            onRegister={(e) => { setSelectedEvent(e); setRegisterOpen(true); }}
                            onDetail={(e) => { setSelectedEvent(e); setDetailOpen(true); }}
                          />
                        ))}
                      </AnimatePresence>
                    </div>
                  </>
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
        <p className="extra-small text-muted mt-2">Your alumni profile will be shared with the recruiter automatically.</p>
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
          <div className="col-md-6"><label className="form-label extra-small fw-bold">Experience</label>
            <input type="text" className="form-control" placeholder="e.g. 2-5 Years" value={newJob.experience} onChange={e => setNewJob({ ...newJob, experience: e.target.value })} /></div>
          <div className="col-md-6"><label className="form-label extra-small fw-bold">Salary Range</label>
            <input type="text" className="form-control" placeholder="e.g. 10-15 LPA" value={newJob.salary} onChange={e => setNewJob({ ...newJob, salary: e.target.value })} /></div>
          <div className="col-12"><label className="form-label extra-small fw-bold">Skills (comma-separated)</label>
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
              <span><FaCalendarAlt className="me-1" style={{ color: '#c84022' }} />{selectedEvent.date}</span>
              <span><FaClock className="me-1" style={{ color: '#c84022' }} />{selectedEvent.time}</span>
              <span className="badge rounded-pill px-3" style={{ backgroundColor: '#fff5f3', color: '#c84022', border: '1px solid #f1c4b8' }}>{selectedEvent.category}</span>
            </div>
            <p className="text-muted mb-3">{selectedEvent.desc}</p>
            {selectedEvent.venue && (
              <div className="p-3 bg-light rounded-3 d-flex align-items-center gap-2">
                <FaMapMarkerAlt style={{ color: '#c84022', fontSize: 20 }} />
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
