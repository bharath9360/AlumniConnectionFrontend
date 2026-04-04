import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { staffService } from '../../services/api';
import { ClipLoader } from 'react-spinners';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line
} from 'recharts';
import {
  FaUsers, FaGraduationCap, FaBriefcase, FaChartBar,
  FaFilter, FaSync, FaCheckCircle, FaTimesCircle,
  FaChalkboardTeacher, FaFileAlt
} from 'react-icons/fa';

// ─── Constants ────────────────────────────────────────────────
const DEPARTMENTS = [
  'all',
  'Computer Science & Engineering',
  'Electronics & Communication Engineering',
  'Electrical & Electronics Engineering',
  'Mechanical Engineering',
  'Civil Engineering',
  'Information Technology',
  'Artificial Intelligence & Data Science',
  'MBA', 'MCA'
];

const YEARS = ['all', '2020', '2021', '2022', '2023', '2024', '2025', '2026', '2027', '2028'];
const STATUSES = ['all', 'Active', 'Pending'];
const MAMCET_RED  = '#c84022';
const STAFF_GREEN = '#1a6b4a';
const PIE_COLORS  = [STAFF_GREEN, '#e05252', '#f5a623', '#378fe9', '#9b59b6'];

// ─── Stat Card component ──────────────────────────────────────
const StatCard = ({ icon: Icon, label, value, color, sub }) => (
  <motion.div
    className="bg-white rounded-4 shadow-sm p-3 d-flex align-items-center gap-3"
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    whileHover={{ y: -3, boxShadow: '0 8px 24px rgba(0,0,0,.10)' }}
    transition={{ type: 'spring', stiffness: 280, damping: 20 }}
    style={{ border: `2px solid ${color}20` }}
  >
    <div
      className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
      style={{ width: 48, height: 48, background: `${color}18` }}
    >
      <Icon size={20} style={{ color }} />
    </div>
    <div>
      <div className="fw-bold" style={{ fontSize: 22 }}>{value ?? '—'}</div>
      <div className="text-muted" style={{ fontSize: 12 }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color }}>{sub}</div>}
    </div>
  </motion.div>
);

// ─── Section header ───────────────────────────────────────────
const SectionHeader = ({ icon: Icon, title, color = MAMCET_RED }) => (
  <div className="d-flex align-items-center gap-2 mb-3">
    <Icon size={18} style={{ color }} />
    <h6 className="fw-bold mb-0" style={{ color }}>{title}</h6>
  </div>
);

// ─── Status Badge ─────────────────────────────────────────────
const StatusBadge = ({ status }) => (
  <span
    className="badge rounded-pill px-2"
    style={{
      fontSize: 11,
      background: status === 'Active' ? '#d4edda' : '#f8d7da',
      color:      status === 'Active' ? '#155724' : '#721c24'
    }}
  >
    {status === 'Active'
      ? <><FaCheckCircle className="me-1" />Active</>
      : <><FaTimesCircle className="me-1" />Inactive</>}
  </span>
);

// ─────────────────────────────────────────────────────────────
//  MAIN COMPONENT
// ─────────────────────────────────────────────────────────────
const StaffDashboard = () => {
  const { user } = useAuth();

  // ── Data state ──
  const [students,  setStudents]  = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [jobReport, setJobReport] = useState(null);

  // ── Loading / error ──
  const [loadingStudents,  setLoadingStudents]  = useState(true);
  const [loadingAnalytics, setLoadingAnalytics] = useState(true);
  const [loadingJobs,      setLoadingJobs]      = useState(true);

  // ── Filters ──
  const [dept,   setDept]   = useState('all');
  const [year,   setYear]   = useState('all');
  const [status, setStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(true);

  // ── Fetch analytics + job report on mount (once) ──
  useEffect(() => {
    staffService.getAnalytics()
      .then(res => setAnalytics(res.data.data))
      .catch(() => setAnalytics(null))
      .finally(() => setLoadingAnalytics(false));

    staffService.getJobReport()
      .then(res => setJobReport(res.data.data))
      .catch(() => setJobReport(null))
      .finally(() => setLoadingJobs(false));
  }, []);

  // ── Fetch student list (re-runs on filter change) ──
  const fetchStudents = useCallback(() => {
    setLoadingStudents(true);
    const params = {};
    if (dept   !== 'all') params.dept   = dept;
    if (year   !== 'all') params.year   = year;
    if (status !== 'all') params.status = status;
    staffService.getStudents(params)
      .then(res => setStudents(res.data.data || []))
      .catch(() => setStudents([]))
      .finally(() => setLoadingStudents(false));
  }, [dept, year, status]);

  useEffect(() => { fetchStudents(); }, [fetchStudents]);

  // ── Client-side search filter ──
  const filtered = students.filter(s =>
    !search || s.name?.toLowerCase().includes(search.toLowerCase()) ||
    s.email?.toLowerCase().includes(search.toLowerCase())
  );

  const totals = analytics?.totals || {};

  return (
    <div className="dashboard-main-bg py-4 min-vh-100">
      <div className="container-fluid px-3 px-lg-4">

        {/* ═══════════════════════════ HEADER ═══════════════════════════ */}
        <motion.div
          className="rounded-4 mb-4 px-4 py-3 d-flex align-items-center gap-3 flex-wrap"
          style={{ background: `linear-gradient(135deg, ${STAFF_GREEN} 0%, #258a5f 100%)`, color: '#fff' }}
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <FaChalkboardTeacher size={36} />
          <div>
            <div className="fw-bold" style={{ fontSize: 19 }}>
              Staff Dashboard — {user?.designation || 'Coordinator'}
            </div>
            <div style={{ fontSize: 13, opacity: 0.9 }}>
              {user?.name} &bull; {user?.department || 'MAMCET'}
            </div>
          </div>
          <div className="ms-auto d-flex gap-2 flex-wrap">
            <button
              className="btn btn-sm btn-light rounded-pill d-flex align-items-center gap-1"
              onClick={fetchStudents}
              style={{ fontSize: 12 }}
            >
              <FaSync size={11} /> Refresh
            </button>
          </div>
        </motion.div>

        {/* ════════════════════════ STAT SUMMARY CARDS ════════════════════ */}
        <div className="row g-3 mb-4">
          <div className="col-6 col-md-3">
            <StatCard icon={FaUsers}       label="Total Students" value={totals.students} color={STAFF_GREEN} />
          </div>
          <div className="col-6 col-md-3">
            <StatCard icon={FaGraduationCap} label="Total Alumni"    value={totals.alumni}   color={MAMCET_RED}  />
          </div>
          <div className="col-6 col-md-3">
            <StatCard icon={FaFileAlt}     label="Total Posts"     value={totals.posts}    color="#378fe9"     />
          </div>
          <div className="col-6 col-md-3">
            <StatCard icon={FaBriefcase}   label="Job Postings"    value={jobReport?.totalJobs} color="#f5a623"
              sub={jobReport ? `${jobReport.approvedJobs} approved` : undefined}
            />
          </div>
        </div>

        <div className="row g-4">

          {/* ════════════════════ LEFT COLUMN (feeds) ════════════════════ */}
          <div className="col-lg-8">

            {/* ── SECTION 1: Filter Panel ── */}
            <motion.div
              className="bg-white rounded-4 shadow-sm mb-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div
                className="d-flex align-items-center justify-content-between px-4 py-3 cursor-pointer"
                onClick={() => setFiltersOpen(o => !o)}
                style={{ cursor: 'pointer' }}
              >
                <div className="d-flex align-items-center gap-2 fw-bold" style={{ fontSize: 14, color: STAFF_GREEN }}>
                  <FaFilter size={14} /> Filter Students
                </div>
                <i className={`fas fa-chevron-${filtersOpen ? 'up' : 'down'} text-muted`} style={{ fontSize: 12 }} />
              </div>

              {filtersOpen && (
                <div className="px-4 pb-4">
                  <div className="row g-3 align-items-end">
                    <div className="col-12 col-sm-6 col-md-3">
                      <label className="form-label small fw-semibold text-muted">Department</label>
                      <select className="form-select form-select-sm" value={dept} onChange={e => setDept(e.target.value)}>
                        <option value="all">All Departments</option>
                        {DEPARTMENTS.filter(d => d !== 'all').map(d => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-6 col-sm-3 col-md-2">
                      <label className="form-label small fw-semibold text-muted">Batch Year</label>
                      <select className="form-select form-select-sm" value={year} onChange={e => setYear(e.target.value)}>
                        <option value="all">All Years</option>
                        {YEARS.filter(y => y !== 'all').map(y => (
                          <option key={y} value={y}>{y}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-6 col-sm-3 col-md-2">
                      <label className="form-label small fw-semibold text-muted">Status</label>
                      <select className="form-select form-select-sm" value={status} onChange={e => setStatus(e.target.value)}>
                        {STATUSES.map(s => (
                          <option key={s} value={s}>{s === 'all' ? 'All Statuses' : s}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-12 col-md-5">
                      <label className="form-label small fw-semibold text-muted">Search by Name / Email</label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        placeholder="Search..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              )}
            </motion.div>

            {/* ── SECTION 2: Student List ── */}
            <motion.div
              className="bg-white rounded-4 shadow-sm mb-4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="px-4 pt-4 pb-2">
                <SectionHeader icon={FaUsers} title={`Students & Alumni (${filtered.length})`} color={STAFF_GREEN} />
              </div>

              {loadingStudents ? (
                <div className="text-center py-5">
                  <ClipLoader color={STAFF_GREEN} size={36} />
                </div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-5 text-muted">
                  <FaUsers size={32} className="mb-2 opacity-25" />
                  <p className="mb-0">No students found for selected filters.</p>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table className="table table-hover mb-0" style={{ fontSize: 13 }}>
                    <thead style={{ background: '#f8f9fa' }}>
                      <tr>
                        <th className="fw-semibold border-0 ps-4">Name</th>
                        <th className="fw-semibold border-0">Department</th>
                        <th className="fw-semibold border-0">Year</th>
                        <th className="fw-semibold border-0">Role</th>
                        <th className="fw-semibold border-0">Posts</th>
                        <th className="fw-semibold border-0">Last Active</th>
                        <th className="fw-semibold border-0">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map(s => (
                        <tr key={s._id}>
                          <td className="ps-4 align-middle">
                            <div className="d-flex align-items-center gap-2">
                              <div
                                className="rounded-circle flex-shrink-0 d-flex align-items-center justify-content-center fw-bold text-white"
                                style={{ width: 32, height: 32, background: MAMCET_RED, fontSize: 13, overflow: 'hidden' }}
                              >
                                {s.profilePic
                                  ? <img src={s.profilePic} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                  : s.name?.[0]?.toUpperCase()}
                              </div>
                              <div>
                                <div className="fw-semibold">{s.name}</div>
                                <div className="text-muted" style={{ fontSize: 11 }}>{s.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="align-middle text-muted">{s.department || '—'}</td>
                          <td className="align-middle text-muted">{s.batch || '—'}</td>
                          <td className="align-middle">
                            <span className="badge rounded-pill px-2"
                              style={{ fontSize: 11, background: s.role === 'alumni' ? '#cce5ff' : '#d4edda', color: s.role === 'alumni' ? '#004085' : '#155724' }}
                            >
                              {s.role}
                            </span>
                          </td>
                          <td className="align-middle fw-bold">{s.postCount}</td>
                          <td className="align-middle text-muted" style={{ fontSize: 11 }}>
                            {s.lastLogin ? new Date(s.lastLogin).toLocaleDateString() : 'Never'}
                          </td>
                          <td className="align-middle"><StatusBadge status={s.status} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </motion.div>

            {/* ── SECTION 4: Job Report ── */}
            <motion.div
              className="bg-white rounded-4 shadow-sm mb-4 p-4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <SectionHeader icon={FaBriefcase} title="Job & Placement Report" color="#f5a623" />

              {loadingJobs ? (
                <div className="text-center py-4"><ClipLoader color="#f5a623" size={28} /></div>
              ) : !jobReport ? (
                <p className="text-muted small">Could not load job report.</p>
              ) : (
                <>
                  <div className="row g-3 mb-4">
                    {[
                      { label: 'Total Jobs Posted',    value: jobReport.totalJobs,     color: '#f5a623' },
                      { label: 'Approved Jobs',        value: jobReport.approvedJobs,  color: STAFF_GREEN },
                      { label: 'Pending Approval',     value: jobReport.pendingJobs,   color: '#e05252' },
                      { label: 'Unique Applicants',    value: jobReport.totalApplicants, color: '#378fe9' },
                    ].map(c => (
                      <div className="col-6 col-md-3" key={c.label}>
                        <div className="rounded-3 text-center p-3" style={{ background: `${c.color}12`, border: `1px solid ${c.color}30` }}>
                          <div className="fw-bold" style={{ fontSize: 24, color: c.color }}>{c.value ?? '—'}</div>
                          <div className="text-muted" style={{ fontSize: 11 }}>{c.label}</div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {jobReport.topJobs?.length > 0 && (
                    <>
                      <div className="fw-semibold mb-2" style={{ fontSize: 13, color: '#444' }}>Top Applied Positions</div>
                      <div className="table-responsive">
                        <table className="table table-sm" style={{ fontSize: 12 }}>
                          <thead>
                            <tr><th>Job Title</th><th>Company</th><th>Applicants</th></tr>
                          </thead>
                          <tbody>
                            {jobReport.topJobs.map(j => (
                              <tr key={j._id}>
                                <td>{j.title}</td>
                                <td className="text-muted">{j.company}</td>
                                <td><span className="fw-bold" style={{ color: '#f5a623' }}>{j.applicants}</span></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </>
                  )}

                  {jobReport.jobsPerMonth?.length > 0 && (
                    <div style={{ height: 160 }} className="mt-3">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={jobReport.jobsPerMonth} margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                          <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                          <Tooltip contentStyle={{ fontSize: 12 }} />
                          <Bar dataKey="count" name="Jobs Posted" fill="#f5a623" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </>
              )}
            </motion.div>

          </div>{/* /col-lg-8 */}

          {/* ════════════════════ RIGHT SIDEBAR (Charts) ═══════════════════ */}
          <div className="col-lg-4">

            {/* ── SECTION 3: Student Activity — top posters ── */}
            <motion.div
              className="bg-white rounded-4 shadow-sm p-4 mb-4"
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.05 }}
            >
              <SectionHeader icon={FaFileAlt} title="Most Active Members" color="#378fe9" />
              {loadingStudents ? (
                <div className="text-center py-3"><ClipLoader color="#378fe9" size={24} /></div>
              ) : (
                <div className="d-flex flex-column gap-2">
                  {[...students].sort((a, b) => b.postCount - a.postCount).slice(0, 6).map((s, i) => (
                    <div key={s._id} className="d-flex align-items-center gap-2 justify-content-between">
                      <div className="d-flex align-items-center gap-2">
                        <span className="fw-bold text-muted" style={{ fontSize: 12, width: 16 }}>{i + 1}.</span>
                        <div
                          className="rounded-circle flex-shrink-0 d-flex align-items-center justify-content-center fw-bold text-white"
                          style={{ width: 28, height: 28, background: MAMCET_RED, fontSize: 11 }}
                        >
                          {s.name?.[0]?.toUpperCase()}
                        </div>
                        <div style={{ fontSize: 12 }}>
                          <div className="fw-semibold">{s.name}</div>
                          <div className="text-muted" style={{ fontSize: 10 }}>{s.department?.split(' ')[0] || 'MAMCET'}</div>
                        </div>
                      </div>
                      <span className="fw-bold" style={{ color: '#378fe9', fontSize: 13 }}>{s.postCount}</span>
                    </div>
                  ))}
                  {students.every(s => s.postCount === 0) && (
                    <p className="text-muted small mb-0">No post data available.</p>
                  )}
                </div>
              )}
            </motion.div>

            {/* ── SECTION 5: Analytics Charts ── */}
            <motion.div
              className="bg-white rounded-4 shadow-sm p-4 mb-4"
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <SectionHeader icon={FaChartBar} title="Active vs Inactive Users" color={STAFF_GREEN} />
              {loadingAnalytics ? (
                <div className="text-center py-3"><ClipLoader color={STAFF_GREEN} size={24} /></div>
              ) : analytics ? (
                <div style={{ height: 200 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Active',   value: analytics.activeUsers },
                          { name: 'Inactive', value: analytics.inactiveUsers }
                        ]}
                        cx="50%" cy="50%"
                        innerRadius={50} outerRadius={80}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        <Cell fill={PIE_COLORS[0]} />
                        <Cell fill={PIE_COLORS[1]} />
                      </Pie>
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                      <Tooltip contentStyle={{ fontSize: 12 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-muted small">Could not load analytics.</p>
              )}
            </motion.div>

            <motion.div
              className="bg-white rounded-4 shadow-sm p-4 mb-4"
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 }}
            >
              <SectionHeader icon={FaChartBar} title="Students per Department" color={MAMCET_RED} />
              {loadingAnalytics ? (
                <div className="text-center py-3"><ClipLoader color={MAMCET_RED} size={24} /></div>
              ) : analytics?.deptStats?.length > 0 ? (
                <div style={{ height: 220 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={analytics.deptStats.slice(0, 8).map(d => ({
                        dept: d.dept.split(' ').slice(0, 2).join(' '),
                        count: d.count
                      }))}
                      layout="vertical"
                      margin={{ top: 0, right: 10, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: 10 }} allowDecimals={false} />
                      <YAxis dataKey="dept" type="category" tick={{ fontSize: 9 }} width={70} />
                      <Tooltip contentStyle={{ fontSize: 12 }} />
                      <Bar dataKey="count" name="Students" fill={MAMCET_RED} radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-muted small">No department data.</p>
              )}
            </motion.div>

            {/* User growth line chart */}
            {analytics?.userGrowth?.length > 0 && (
              <motion.div
                className="bg-white rounded-4 shadow-sm p-4 mb-4"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <SectionHeader icon={FaChartBar} title="User Registration Trend" color="#378fe9" />
                <div style={{ height: 160 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={analytics.userGrowth} margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                      <Tooltip contentStyle={{ fontSize: 12 }} />
                      <Line type="monotone" dataKey="count" name="New Users" stroke="#378fe9" strokeWidth={2} dot={{ r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>
            )}

          </div>{/* /col-lg-4 */}

        </div>{/* /row */}
      </div>
    </div>
  );
};

export default StaffDashboard;
