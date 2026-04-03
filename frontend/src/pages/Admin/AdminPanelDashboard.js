import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { adminService } from '../../services/api';
import { ClipLoader } from 'react-spinners';
import { useAuth } from '../../context/AuthContext';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement, PointElement,
  LineElement, Title, Tooltip, Legend, ArcElement, Filler,
} from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import {
  FiUsers, FiUserCheck, FiActivity, FiAlertCircle,
  FiFileText, FiRefreshCw, FiArrowUpRight, FiTrendingUp,
  FiShield, FiCalendar,
} from 'react-icons/fi';

// Register Chart.js components
ChartJS.register(
  CategoryScale, LinearScale, BarElement, PointElement,
  LineElement, Title, Tooltip, Legend, ArcElement, Filler,
);

// ── Colour palette ────────────────────────────────────────────
const PALETTE = {
  red:    '#c84022',
  indigo: '#6366f1',
  teal:   '#14b8a6',
  amber:  '#f59e0b',
  green:  '#10b981',
  purple: '#8b5cf6',
  blue:   '#3b82f6',
  pink:   '#ec4899',
};

// ── Dummy fallback data (shown when real data is absent) ──────
const DUMMY_ANALYTICS = {
  kpis: {
    totalStudents:   142,
    totalAlumni:     318,
    activeUsers:     412,
    pendingApprovals: 7,
    totalPosts:       89,
  },
  departmentDistribution: [
    { department: 'CSE',   count: 135 },
    { department: 'ECE',   count: 102 },
    { department: 'IT',    count:  88 },
    { department: 'MECH',  count:  76 },
    { department: 'EEE',   count:  59 },
    { department: 'CIVIL', count:  43 },
    { department: 'MBA',   count:  28 },
    { department: 'MCA',   count:  19 },
  ],
  yearWiseAlumni: [
    { year: '2017', count:  18 },
    { year: '2018', count:  34 },
    { year: '2019', count:  47 },
    { year: '2020', count:  52 },
    { year: '2021', count:  63 },
    { year: '2022', count:  71 },
    { year: '2023', count:  58 },
    { year: '2024', count:  45 },
  ],
  recentActivity: {
    registrations: [
      { _id: '1', name: 'Aarav Sharma',   role: 'alumni',  department: 'CSE', status: 'Active',  createdAt: new Date(Date.now() - 3600000).toISOString() },
      { _id: '2', name: 'Priya Nair',     role: 'student', department: 'ECE', status: 'Active',  createdAt: new Date(Date.now() - 7200000).toISOString() },
      { _id: '3', name: 'Karthik Raj',    role: 'alumni',  department: 'IT',  status: 'Pending', createdAt: new Date(Date.now() - 10800000).toISOString() },
      { _id: '4', name: 'Divya Mehta',    role: 'alumni',  department: 'MECH',status: 'Pending', createdAt: new Date(Date.now() - 14400000).toISOString() },
      { _id: '5', name: 'Sanjay Kumar',   role: 'student', department: 'EEE', status: 'Active',  createdAt: new Date(Date.now() - 21600000).toISOString() },
    ],
    posts: [
      { _id: 'p1', author: { name: 'Aarav Sharma', role: 'alumni' },  content: 'Excited to share my internship experience at Google!',     createdAt: new Date(Date.now() - 1800000).toISOString() },
      { _id: 'p2', author: { name: 'Admin',         role: 'admin' },   content: 'Upcoming Alumni Meet 2025 — Register before March 30th.',   createdAt: new Date(Date.now() - 5400000).toISOString() },
      { _id: 'p3', author: { name: 'Priya Nair',    role: 'alumni' },  content: 'Looking for referrals in Amazon SDE-1 openings.',           createdAt: new Date(Date.now() - 9000000).toISOString() },
    ],
    jobs: [
      { _id: 'j1', title: 'Frontend Developer', company: 'Zoho',    status: 'Pending',  postedBy: { name: 'Karthik Raj' }, createdAt: new Date(Date.now() - 3600000).toISOString() },
      { _id: 'j2', title: 'Data Analyst',        company: 'TCS',     status: 'Approved', postedBy: { name: 'Divya Mehta' }, createdAt: new Date(Date.now() - 7200000).toISOString() },
      { _id: 'j3', title: 'DevOps Engineer',     company: 'Infosys', status: 'Pending',  postedBy: { name: 'Sanjay Kumar'}, createdAt: new Date(Date.now() - 18000000).toISOString() },
    ],
  },
};

// ── Helpers ───────────────────────────────────────────────────
const timeAgo = (dateStr) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins  < 1)  return 'Just now';
  if (hours < 1)  return `${mins}m ago`;
  if (days  < 1)  return `${hours}h ago`;
  return `${days}d ago`;
};

const rolePill = (role) => {
  const map = { alumni: '#6366f1', student: '#14b8a6', admin: '#c84022' };
  return (
    <span style={{
      background: `${map[role] || '#999'}18`,
      color: map[role] || '#999',
      borderRadius: 20,
      padding: '1px 8px',
      fontSize: 11,
      fontWeight: 600,
      textTransform: 'capitalize',
    }}>{role}</span>
  );
};

// ── KPI Card ──────────────────────────────────────────────────
const KpiCard = ({ icon: Icon, label, value, iconBg, delta, deltaColor, link }) => (
  <Link to={link || '#'} style={{ textDecoration: 'none' }}>
    <div className="ap-kpi-card">
      <div className="ap-kpi-icon" style={{ background: iconBg }}>
        <Icon size={20} color="#fff" />
      </div>
      <div style={{ flex: 1 }}>
        <div className="ap-kpi-label">{label}</div>
        <div className="ap-kpi-value">{value ?? '—'}</div>
        {delta != null && (
          <div className="ap-kpi-delta" style={{ color: deltaColor || '#10b981' }}>
            <FiTrendingUp size={11} /> {delta}
          </div>
        )}
      </div>
      <FiArrowUpRight size={16} color="#ccc" />
    </div>
  </Link>
);

// ── Chart options ─────────────────────────────────────────────
const commonChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: '#1a1a2e',
      titleColor: '#fff',
      bodyColor: 'rgba(255,255,255,0.75)',
      padding: 10,
      cornerRadius: 8,
    },
  },
  scales: {
    x: {
      grid: { display: false },
      ticks: { font: { size: 11 }, color: '#aaa' },
    },
    y: {
      grid: { color: 'rgba(0,0,0,0.04)', drawBorder: false },
      ticks: { font: { size: 11 }, color: '#aaa' },
      beginAtZero: true,
    },
  },
};

// ════════════════════════════════════════════════════════════════
//  MAIN COMPONENT
// ════════════════════════════════════════════════════════════════
const AdminPanelDashboard = () => {
  const { user } = useAuth();
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminService.getAnalytics();
      setData(res.data.data);
    } catch (err) {
      // Gracefully fall back to dummy data so the layout always looks good
      console.warn('[AdminDashboard] API unavailable — using demo data.', err.message);
      setData(DUMMY_ANALYTICS);
      setError('Could not reach the server. Showing demo data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAnalytics(); }, [fetchAnalytics]);

  if (loading) {
    return (
      <div className="ap-loader">
        <ClipLoader color="#c84022" size={44} />
      </div>
    );
  }

  const { kpis, departmentDistribution, yearWiseAlumni, recentActivity } = data;

  // ── Bar chart: Department distribution ─────────────────────
  const deptLabels = departmentDistribution.map(d => d.department);
  const deptCounts = departmentDistribution.map(d => d.count);
  const barData = {
    labels: deptLabels,
    datasets: [{
      label: 'Members',
      data: deptCounts,
      backgroundColor: [
        PALETTE.red, PALETTE.indigo, PALETTE.teal, PALETTE.amber,
        PALETTE.green, PALETTE.purple, PALETTE.blue, PALETTE.pink,
      ],
      borderRadius: 6,
      borderSkipped: false,
    }],
  };

  // ── Line chart: Year-wise alumni ───────────────────────────
  const yearLabels  = yearWiseAlumni.map(y => y.year);
  const yearCounts  = yearWiseAlumni.map(y => y.count);
  const lineData = {
    labels: yearLabels,
    datasets: [{
      label: 'Alumni',
      data: yearCounts,
      borderColor: PALETTE.indigo,
      backgroundColor: (ctx) => {
        const chart = ctx.chart;
        const { ctx: c, chartArea } = chart;
        if (!chartArea) return 'transparent';
        const gradient = c.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
        gradient.addColorStop(0, 'rgba(99,102,241,0.22)');
        gradient.addColorStop(1, 'rgba(99,102,241,0)');
        return gradient;
      },
      fill: true,
      tension: 0.45,
      pointBackgroundColor: PALETTE.indigo,
      pointRadius: 4,
      pointHoverRadius: 6,
    }],
  };

  // ── Doughnut: Role split ───────────────────────────────────
  const doughnutData = {
    labels: ['Alumni', 'Students'],
    datasets: [{
      data: [kpis.totalAlumni, kpis.totalStudents],
      backgroundColor: [PALETTE.indigo, PALETTE.teal],
      borderWidth: 0,
      hoverOffset: 4,
    }],
  };

  return (
    <div>
      {/* ── Section header ──────────────────────────────────── */}
      <div className="ap-section-header">
        <div>
          <div className="ap-section-title">
            Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, {user?.name?.split(' ')[0] || 'Admin'} 👋
          </div>
          <div className="ap-section-sub">Here's what's happening on your platform today.</div>
        </div>
        <button
          onClick={fetchAnalytics}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: '#fff', border: '1px solid #e8e8e8',
            borderRadius: 8, padding: '8px 14px', cursor: 'pointer',
            fontSize: 13, color: '#555', fontWeight: 600,
            transition: 'background 0.15s',
          }}
          title="Refresh"
        >
          <FiRefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* ── Error banner (demo mode) ─────────────────────────── */}
      {error && (
        <div style={{
          background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)',
          borderRadius: 10, padding: '10px 16px', marginBottom: 20,
          fontSize: 13, color: '#92400e', display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <FiAlertCircle size={15} />
          {error}
        </div>
      )}

      {/* ──────────────────────────────────────────────────────
          KPI CARDS
      ────────────────────────────────────────────────────── */}
      <div className="ap-kpi-grid">
        <KpiCard
          icon={FiUsers}
          label="Total Students"
          value={kpis.totalStudents}
          iconBg={PALETTE.teal}
          delta="Enrolled this semester"
          deltaColor={PALETTE.teal}
          link="/admin/students"
        />
        <KpiCard
          icon={FiUserCheck}
          label="Total Alumni"
          value={kpis.totalAlumni}
          iconBg={PALETTE.indigo}
          delta="Network members"
          deltaColor={PALETTE.indigo}
          link="/admin/alumni"
        />
        <KpiCard
          icon={FiActivity}
          label="Active Users"
          value={kpis.activeUsers}
          iconBg={PALETTE.green}
          delta="Verified accounts"
          deltaColor={PALETTE.green}
          link="/admin/alumni"
        />
        <KpiCard
          icon={FiAlertCircle}
          label="Pending Approvals"
          value={kpis.pendingApprovals}
          iconBg={kpis.pendingApprovals > 0 ? PALETTE.red : PALETTE.green}
          delta={kpis.pendingApprovals > 0 ? 'Needs your attention' : 'All clear!'}
          deltaColor={kpis.pendingApprovals > 0 ? PALETTE.red : PALETTE.green}
          link="/admin/approvals"
        />
      </div>

      {/* ──────────────────────────────────────────────────────
          CHARTS ROW
      ────────────────────────────────────────────────────── */}
      <div className="ap-chart-grid">
        {/* Bar: Department distribution */}
        <div className="ap-chart-card">
          <div className="ap-card-title">
            <FiUsers size={15} color={PALETTE.red} />
            Department-wise Distribution
          </div>
          <div className="ap-card-subtitle">All students & alumni by department</div>
          <div className="ap-chart-wrap">
            <Bar
              data={barData}
              options={{
                ...commonChartOptions,
                plugins: {
                  ...commonChartOptions.plugins,
                  tooltip: {
                    ...commonChartOptions.plugins.tooltip,
                    callbacks: {
                      label: (ctx) => ` ${ctx.parsed.y} members`,
                    },
                  },
                },
              }}
            />
          </div>
        </div>

        {/* Line: Year-wise alumni + Doughnut side by side */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Line chart */}
          <div className="ap-chart-card" style={{ flex: 1 }}>
            <div className="ap-card-title">
              <FiTrendingUp size={15} color={PALETTE.indigo} />
              Year-wise Alumni Count
            </div>
            <div className="ap-card-subtitle">Alumni growth by graduation batch</div>
            <div className="ap-chart-wrap" style={{ height: 180 }}>
              <Line
                data={lineData}
                options={{
                  ...commonChartOptions,
                  plugins: {
                    ...commonChartOptions.plugins,
                    tooltip: {
                      ...commonChartOptions.plugins.tooltip,
                      callbacks: {
                        label: (ctx) => ` ${ctx.parsed.y} alumni`,
                      },
                    },
                  },
                }}
              />
            </div>
          </div>

          {/* Doughnut: Role split */}
          <div className="ap-chart-card ap-doughnut-card" style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <div style={{ width: 110, height: 110, flexShrink: 0 }}>
              <Doughnut
                data={doughnutData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  cutout: '72%',
                  plugins: {
                    legend: { display: false },
                    tooltip: { backgroundColor: '#1a1a2e', padding: 8, cornerRadius: 8 },
                  },
                }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <div className="ap-card-title" style={{ marginBottom: 12 }}>
                User Role Split
              </div>
              {[
                { label: 'Alumni',   value: kpis.totalAlumni,   color: PALETTE.indigo },
                { label: 'Students', value: kpis.totalStudents, color: PALETTE.teal },
              ].map(r => (
                <div key={r.label} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: r.color, flexShrink: 0 }} />
                  <span style={{ fontSize: 13, color: '#666', flex: 1 }}>{r.label}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#333' }}>{r.value}</span>
                </div>
              ))}
              <div style={{ fontSize: 12, color: '#aaa', marginTop: 6 }}>
                Total: {kpis.totalAlumni + kpis.totalStudents}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────
          RECENT ACTIVITY
      ────────────────────────────────────────────────────── */}
      <div className="ap-activity-grid">

        {/* Recent Registrations table */}
        <div className="ap-activity-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div>
              <div className="ap-card-title"><FiUsers size={14} color={PALETTE.indigo} /> Recent Registrations</div>
              <div className="ap-card-subtitle">Newest users on the platform</div>
            </div>
            <Link
              to="/admin/approvals"
              style={{ fontSize: 12, color: PALETTE.red, fontWeight: 600, textDecoration: 'none', whiteSpace: 'nowrap' }}
            >
              View All →
            </Link>
          </div>
          <table className="ap-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Dept</th>
                <th>Role</th>
                <th>Status</th>
                <th>Joined</th>
              </tr>
            </thead>
            <tbody>
              {recentActivity.registrations.map(u => (
                <tr key={u._id}>
                  <td>
                    <div className="ap-user-row">
                      <div className="ap-mini-avatar">
                        {u.profilePic
                          ? <img src={u.profilePic} alt={u.name} />
                          : u.name?.[0]?.toUpperCase()}
                      </div>
                      <span style={{ fontWeight: 600, fontSize: 13 }}>{u.name}</span>
                    </div>
                  </td>
                  <td>{u.department || '—'}</td>
                  <td>{rolePill(u.role)}</td>
                  <td>
                    <span className={`ap-status-pill ${u.status === 'Active' ? 'ap-status-active' : 'ap-status-pending'}`}>
                      {u.status}
                    </span>
                  </td>
                  <td style={{ color: '#aaa', fontSize: 12 }}>{timeAgo(u.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Right column: Recent Posts + Job Reports */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Recent Posts */}
          <div className="ap-activity-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div className="ap-card-title">
                <FiFileText size={14} color={PALETTE.teal} /> New Posts
              </div>
              <Link
                to="/admin/posts"
                style={{ fontSize: 12, color: PALETTE.red, fontWeight: 600, textDecoration: 'none' }}
              >
                Moderate →
              </Link>
            </div>
            {recentActivity.posts.map(p => (
              <div key={p._id} className="ap-tip-item">
                <div className="ap-tip-dot" style={{ background: PALETTE.teal }} />
                <div>
                  <div className="ap-tip-text" style={{ fontWeight: 600, fontSize: 12 }}>
                    {p.author?.name} <span style={{ color: '#aaa', fontWeight: 400 }}>({p.author?.role})</span>
                  </div>
                  <div className="ap-tip-text">
                    {(p.content || '').slice(0, 65)}{(p.content || '').length > 65 ? '…' : ''}
                  </div>
                  <div className="ap-tip-time">{timeAgo(p.createdAt)}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Pending Jobs (Reports) */}
          <div className="ap-activity-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div className="ap-card-title">
                <FiShield size={14} color={PALETTE.amber} /> Job Reports
              </div>
              <Link
                to="/admin/jobs"
                style={{ fontSize: 12, color: PALETTE.red, fontWeight: 600, textDecoration: 'none' }}
              >
                Review →
              </Link>
            </div>
            {recentActivity.jobs.map(j => (
              <div key={j._id} className="ap-tip-item">
                <div className="ap-tip-dot"
                  style={{ background: j.status === 'Pending' ? PALETTE.amber : PALETTE.green }}
                />
                <div style={{ flex: 1 }}>
                  <div className="ap-tip-text" style={{ fontWeight: 600, fontSize: 12, marginBottom: 2 }}>
                    {j.title} — <span style={{ color: '#888' }}>{j.company}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div className="ap-tip-time">Posted by {j.postedBy?.name}</div>
                    <span className={`ap-status-pill ${j.status === 'Pending' ? 'ap-status-pending' : 'ap-status-active'}`}>
                      {j.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>

      {/* ── Quick-action footer strip ─────────────────────────── */}
      <div className="ap-quick-links-strip" style={{
        marginTop: 24,
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
        gap: 12,
      }}>
        {[
          { icon: FiUserCheck, label: 'Manage Alumni',   to: '/admin/alumni',   bg: PALETTE.indigo },
          { icon: FiUsers,     label: 'View Students',   to: '/admin/students', bg: PALETTE.teal   },
          { icon: FiShield,    label: 'Pending Reviews', to: '/admin/approvals',bg: PALETTE.red    },
          { icon: FiCalendar,  label: 'Events',          to: '/admin/events',   bg: PALETTE.amber  },
          { icon: FiFileText,  label: 'Moderate Posts',  to: '/admin/posts',    bg: PALETTE.green  },
        ].map(({ icon: Icon, label, to, bg }) => (
          <Link
            key={to}
            to={to}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              background: '#fff', borderRadius: 12, padding: '14px 16px',
              textDecoration: 'none', border: '1px solid #f0f0f0',
              color: '#333', fontSize: 13, fontWeight: 600,
              transition: 'transform 0.14s, box-shadow 0.14s',
              boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.08)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.04)'; }}
          >
            <div style={{ width: 36, height: 36, borderRadius: 9, background: `${bg}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon size={16} color={bg} />
            </div>
            {label}
          </Link>
        ))}
      </div>
    </div>
  );
};

export default AdminPanelDashboard;
