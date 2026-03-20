import React, { useState, useEffect } from 'react';
import { adminService, jobService, eventService } from '../../services/api';
import toast from 'react-hot-toast';
import { ClipLoader } from 'react-spinners';
import { FiCheck, FiX, FiUser, FiBriefcase, FiCalendar, FiRefreshCw } from 'react-icons/fi';

const AdminApprovals = () => {
  const [activeTab, setActiveTab] = useState('alumni');
  const [pendingAlumni, setPendingAlumni] = useState([]);
  const [pendingJobs, setPendingJobs] = useState([]);
  const [pendingEvents, setPendingEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState(null);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [a, j, e] = await Promise.all([
        adminService.getPendingAlumni(),
        jobService.getPendingJobs(),
        eventService.getPendingEvents()
      ]);
      setPendingAlumni(a.data.data || []);
      setPendingJobs(j.data.data || []);
      setPendingEvents(e.data.data || []);
    } catch (err) {
      toast.error('Failed to fetch pending approvals.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  // Alumni actions
  const handleActivate = async (userId) => {
    setActionId(userId);
    try {
      await adminService.activateUser(userId);
      setPendingAlumni(prev => prev.filter(u => u._id !== userId));
      toast.success('Alumni account activated! Email sent. ✅');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to activate.');
    } finally { setActionId(null); }
  };

  const handleRejectAlumni = async (userId) => {
    setActionId(userId);
    try {
      await adminService.rejectUser(userId);
      setPendingAlumni(prev => prev.filter(u => u._id !== userId));
      toast.success('Application rejected.');
    } catch (err) {
      toast.error('Failed to reject.');
    } finally { setActionId(null); }
  };

  // Job actions
  const handleApproveJob = async (jobId) => {
    setActionId(jobId);
    try {
      await jobService.approveJob(jobId);
      setPendingJobs(prev => prev.filter(j => j._id !== jobId));
      toast.success('Job approved and published! Students notified. ✅');
    } catch (err) {
      toast.error('Failed to approve job.');
    } finally { setActionId(null); }
  };

  const handleRejectJob = async (jobId) => {
    setActionId(jobId);
    try {
      await jobService.rejectJob(jobId);
      setPendingJobs(prev => prev.filter(j => j._id !== jobId));
      toast.success('Job rejected.');
    } catch (err) {
      toast.error('Failed to reject job.');
    } finally { setActionId(null); }
  };

  // Event actions
  const handleApproveEvent = async (eventId) => {
    setActionId(eventId);
    try {
      await eventService.approveEvent(eventId);
      setPendingEvents(prev => prev.filter(e => e._id !== eventId));
      toast.success('Event approved! Students notified. ✅');
    } catch (err) {
      toast.error('Failed to approve event.');
    } finally { setActionId(null); }
  };

  const handleRejectEvent = async (eventId) => {
    setActionId(eventId);
    try {
      await eventService.rejectEvent(eventId);
      setPendingEvents(prev => prev.filter(e => e._id !== eventId));
      toast.success('Event rejected.');
    } catch (err) {
      toast.error('Failed to reject event.');
    } finally { setActionId(null); }
  };

  const tabs = [
    { key: 'alumni', label: 'Pending Alumni', icon: FiUser, count: pendingAlumni.length },
    { key: 'jobs', label: 'Pending Jobs', icon: FiBriefcase, count: pendingJobs.length },
    { key: 'events', label: 'Pending Events', icon: FiCalendar, count: pendingEvents.length },
  ];

  return (
    <div className="dashboard-main-bg min-vh-100 py-4">
      <div className="container" style={{ maxWidth: '900px' }}>

        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 className="fw-bold mb-0" style={{ color: '#c84022' }}>Approvals</h2>
          <button className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-2" onClick={fetchAll}>
            <FiRefreshCw /> Refresh
          </button>
        </div>

        {/* Tabs */}
        <div className="d-flex gap-2 mb-4 flex-wrap">
          {tabs.map(tab => (
            <button
              key={tab.key}
              className="btn d-flex align-items-center gap-2"
              style={{
                backgroundColor: activeTab === tab.key ? '#c84022' : 'white',
                color: activeTab === tab.key ? 'white' : '#333',
                border: '1.5px solid #c84022',
                borderRadius: '20px',
                fontWeight: 600,
                fontSize: '0.85rem'
              }}
              onClick={() => setActiveTab(tab.key)}
            >
              <tab.icon size={16} />
              {tab.label}
              {tab.count > 0 && (
                <span className="badge rounded-pill ms-1"
                  style={{ backgroundColor: activeTab === tab.key ? 'white' : '#c84022', color: activeTab === tab.key ? '#c84022' : 'white', fontSize: '0.7rem' }}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-5"><ClipLoader color="#c84022" size={40} /></div>
        ) : (
          <>
            {/* ALUMNI TAB */}
            {activeTab === 'alumni' && (
              pendingAlumni.length === 0 ? (
                <EmptyState icon="👤" msg="No pending alumni registrations." />
              ) : (
                pendingAlumni.map(u => (
                  <ApprovalCard key={u._id} id={u._id} actionId={actionId}>
                    <div className="d-flex align-items-center gap-3">
                      <div className="rounded-circle d-flex align-items-center justify-content-center fw-bold text-white flex-shrink-0"
                        style={{ width: '48px', height: '48px', backgroundColor: '#c84022', fontSize: '1.1rem' }}>
                        {u.name?.charAt(0)}
                      </div>
                      <div className="flex-grow-1">
                        <h6 className="fw-bold mb-0">{u.name}</h6>
                        <p className="text-muted mb-0" style={{ fontSize: '0.83rem' }}>{u.email}</p>
                        <p className="text-muted mb-0" style={{ fontSize: '0.83rem' }}>
                          {u.department} • Batch {u.batch} • {u.presentStatus}
                        </p>
                      </div>
                      <div className="d-flex gap-2">
                        <button className="btn btn-sm btn-success d-flex align-items-center gap-1" onClick={() => handleActivate(u._id)} disabled={actionId === u._id}>
                          {actionId === u._id ? <ClipLoader size={12} color="white" /> : <><FiCheck /> Approve</>}
                        </button>
                        <button className="btn btn-sm btn-outline-danger d-flex align-items-center gap-1" onClick={() => handleRejectAlumni(u._id)} disabled={actionId === u._id}>
                          <FiX /> Reject
                        </button>
                      </div>
                    </div>
                  </ApprovalCard>
                ))
              )
            )}

            {/* JOBS TAB */}
            {activeTab === 'jobs' && (
              pendingJobs.length === 0 ? (
                <EmptyState icon="💼" msg="No pending job postings." />
              ) : (
                pendingJobs.map(j => (
                  <ApprovalCard key={j._id} id={j._id} actionId={actionId}>
                    <div>
                      <div className="d-flex justify-content-between align-items-start">
                        <div>
                          <h6 className="fw-bold mb-0">{j.title}</h6>
                          <p className="text-muted mb-1" style={{ fontSize: '0.83rem' }}>{j.company} • {j.location} • {j.type}</p>
                          <p className="text-muted mb-0" style={{ fontSize: '0.8rem' }}>
                            By: <strong>{j.postedBy?.name || j.postedByName}</strong> ({j.postedBy?.role})
                          </p>
                        </div>
                        <div className="d-flex gap-2 flex-shrink-0 ms-3">
                          <button className="btn btn-sm btn-success d-flex align-items-center gap-1" onClick={() => handleApproveJob(j._id)} disabled={actionId === j._id}>
                            {actionId === j._id ? <ClipLoader size={12} color="white" /> : <><FiCheck /> Approve</>}
                          </button>
                          <button className="btn btn-sm btn-outline-danger d-flex align-items-center gap-1" onClick={() => handleRejectJob(j._id)} disabled={actionId === j._id}>
                            <FiX /> Reject
                          </button>
                        </div>
                      </div>
                      {j.description && <p className="text-muted mt-2 mb-0" style={{ fontSize: '0.83rem' }}>{j.description.slice(0, 120)}{j.description.length > 120 ? '...' : ''}</p>}
                    </div>
                  </ApprovalCard>
                ))
              )
            )}

            {/* EVENTS TAB */}
            {activeTab === 'events' && (
              pendingEvents.length === 0 ? (
                <EmptyState icon="📅" msg="No pending events." />
              ) : (
                pendingEvents.map(e => (
                  <ApprovalCard key={e._id} id={e._id} actionId={actionId}>
                    <div className="d-flex justify-content-between align-items-start">
                      <div>
                        <h6 className="fw-bold mb-0">{e.title}</h6>
                        <p className="text-muted mb-1" style={{ fontSize: '0.83rem' }}>{e.date} at {e.venue || 'TBD'} • {e.category}</p>
                        <p className="text-muted mb-0" style={{ fontSize: '0.8rem' }}>
                          By: <strong>{e.createdBy?.name}</strong> ({e.createdBy?.role})
                        </p>
                      </div>
                      <div className="d-flex gap-2 flex-shrink-0 ms-3">
                        <button className="btn btn-sm btn-success d-flex align-items-center gap-1" onClick={() => handleApproveEvent(e._id)} disabled={actionId === e._id}>
                          {actionId === e._id ? <ClipLoader size={12} color="white" /> : <><FiCheck /> Approve</>}
                        </button>
                        <button className="btn btn-sm btn-outline-danger d-flex align-items-center gap-1" onClick={() => handleRejectEvent(e._id)} disabled={actionId === e._id}>
                          <FiX /> Reject
                        </button>
                      </div>
                    </div>
                  </ApprovalCard>
                ))
              )
            )}
          </>
        )}
      </div>
    </div>
  );
};

const ApprovalCard = ({ children, id, actionId }) => (
  <div className="bg-white rounded-3 shadow-sm p-4 mb-3" style={{ opacity: actionId === id ? 0.6 : 1, transition: 'opacity 0.2s' }}>
    {children}
  </div>
);

const EmptyState = ({ icon, msg }) => (
  <div className="bg-white rounded-3 shadow-sm p-5 text-center">
    <div style={{ fontSize: '3rem' }} className="mb-3">{icon}</div>
    <p className="text-muted mb-0">{msg}</p>
  </div>
);

export default AdminApprovals;
