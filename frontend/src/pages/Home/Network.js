import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { connectionService, userService } from '../../services/api';
import toast from 'react-hot-toast';
import {
  FiUsers,
  FiUserPlus,
  FiUserCheck,
  FiClock,
  FiX,
  FiSearch,
  FiBriefcase,
  FiFilter,
  FiChevronDown,
} from 'react-icons/fi';

/* ─────────────────────────────────────────────────────────────
   DEPARTMENTS — MAMCET departments for filter dropdown
───────────────────────────────────────────────────────────── */
const DEPARTMENTS = [
  'Computer Science and Engineering',
  'Electronics and Communication Engineering',
  'Electrical and Electronics Engineering',
  'Mechanical Engineering',
  'Civil Engineering',
  'Information Technology',
  'AIDS',
  'Aeronautical Engineering',
  'Other',
];

/* ─────────────────────────────────────────────────────────────
   USER CARD
───────────────────────────────────────────────────────────── */
const UserCard = ({ user, type, onAction, actionLoading, connected }) => {
  const navigate   = useNavigate();
  const picUrl     = user?.profilePic || '';
  const initials   = (user?.name || '?')[0].toUpperCase();
  const mutuals    = user?.mutualConnections || 0;

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow flex flex-col h-full">
      {/* Banner */}
      <div className="h-16 bg-gradient-to-r from-red-50 to-red-100 w-full relative">
        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2">
          <div
            onClick={() => navigate(`/profile/${user._id}`)}
            className="w-16 h-16 rounded-full border-4 border-white bg-white overflow-hidden shadow-sm cursor-pointer flex items-center justify-center text-xl font-bold text-red-600 select-none"
          >
            {picUrl
              ? <img src={picUrl} alt={user.name} className="w-full h-full object-cover" onError={e => { e.target.onerror = null; e.target.style.display = 'none'; }} />
              : initials}
          </div>
        </div>
      </div>

      <div className="flex-1 px-4 pt-10 pb-4 text-center flex flex-col">
        {/* Name */}
        <h3
          className="font-bold text-gray-900 text-[15px] hover:text-red-700 cursor-pointer transition line-clamp-1"
          onClick={() => navigate(`/profile/${user._id}`)}
        >
          {user.name}
        </h3>

        {/* Role badge */}
        <span className={`inline-block mt-1 text-[10px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-full ${user.role === 'alumni' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
          {user.role}
        </span>

        {/* Dept + Batch */}
        <p className="text-[12px] text-gray-500 mt-2 line-clamp-2 min-h-[34px] leading-relaxed">
          {user.department || '—'}
          {user.batch ? <span className="text-gray-400"> · Batch {user.batch}</span> : null}
        </p>

        {/* Company (alumni) */}
        {user.role === 'alumni' && user.company && (
          <div className="flex items-center justify-center gap-1 text-[11px] text-gray-600 font-medium mt-1">
            <FiBriefcase size={10} />
            <span className="line-clamp-1">{user.company}</span>
          </div>
        )}

        {/* Designation (student higher-ed) */}
        {user.role === 'student' && user.designation && (
          <p className="text-[11px] text-gray-400 mt-1 line-clamp-1">{user.designation}</p>
        )}

        {/* Mutual connections badge */}
        {mutuals > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, fontSize: 11, color: '#6b7280', marginTop: 4 }}>
            <FiUsers size={10} />
            <span>{mutuals} mutual connection{mutuals !== 1 ? 's' : ''}</span>
          </div>
        )}

        {/* Actions */}
        <div className="mt-auto pt-4 flex gap-2">
          <button
            onClick={() => navigate(`/profile/${user._id}`)}
            className="flex-1 py-1.5 px-3 border border-red-200 text-red-600 font-semibold rounded-full text-xs hover:bg-red-50 transition"
          >
            View Profile
          </button>

          {type === 'suggestion' && !connected && (
            <button
              disabled={actionLoading === user._id}
              onClick={() => onAction(user._id)}
              className="flex-1 py-1.5 px-3 bg-red-600 text-white font-semibold rounded-full text-xs hover:bg-red-700 transition disabled:opacity-50 flex items-center justify-center gap-1"
            >
              {actionLoading === user._id ? 'Sending…' : <><FiUserPlus size={12} /> Connect</>}
            </button>
          )}

          {(type === 'suggestion' && connected) && (
            <span className="flex-1 py-1.5 px-3 border border-green-200 text-green-700 font-semibold rounded-full text-xs flex items-center justify-center gap-1">
              <FiUserCheck size={12} /> Connected
            </span>
          )}

          {type === 'connection' && (
            <button
              onClick={() => navigate(`/messaging`)}
              className="flex-1 py-1.5 px-3 bg-white border border-gray-300 text-gray-700 font-semibold rounded-full text-xs hover:bg-gray-50 transition"
            >
              Message
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────
   SEARCH RESULT ROW  (compact list for search mode)
───────────────────────────────────────────────────────────── */
const SearchResultRow = ({ user, onConnect, actionLoading, connectedIds }) => {
  const navigate  = useNavigate();
  const isConn    = connectedIds.has(user._id);
  const picUrl    = user?.profilePic || '';
  const initials  = (user?.name || '?')[0].toUpperCase();

  return (
    <div className="flex items-center gap-4 px-4 py-3.5 hover:bg-gray-50 transition">
      {/* Avatar */}
      <div
        onClick={() => navigate(`/profile/${user._id}`)}
        className="w-12 h-12 rounded-full border-2 border-white shadow-sm bg-red-50 overflow-hidden flex items-center justify-center text-base font-bold text-red-600 cursor-pointer flex-shrink-0"
      >
        {picUrl
          ? <img src={picUrl} alt={user.name} className="w-full h-full object-cover" onError={e => { e.target.onerror = null; e.target.style.display = 'none'; }} />
          : initials}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span
            className="font-semibold text-gray-900 text-sm hover:text-red-700 cursor-pointer transition line-clamp-1"
            onClick={() => navigate(`/profile/${user._id}`)}
          >
            {user.name}
          </span>
          <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-full flex-shrink-0 ${user.role === 'alumni' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
            {user.role}
          </span>
        </div>
        <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">
          {user.department || '—'}
          {user.batch ? ` · Batch ${user.batch}` : ''}
          {user.company ? ` · ${user.company}` : ''}
        </p>
      </div>

      {/* CTA */}
      <div className="flex-shrink-0">
        {isConn ? (
          <span className="flex items-center gap-1 text-xs font-semibold text-green-600">
            <FiUserCheck size={13} /> Connected
          </span>
        ) : (
          <button
            disabled={actionLoading === user._id}
            onClick={() => onConnect(user._id)}
            className="flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white rounded-full text-xs font-semibold hover:bg-red-700 transition disabled:opacity-50"
          >
            {actionLoading === user._id ? '…' : <><FiUserPlus size={11} /> Connect</>}
          </button>
        )}
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────
   MAIN NETWORK PAGE
───────────────────────────────────────────────────────────── */
const Network = () => {
  /* ── Tab state ───────────────────────── */
  const [activeTab, setActiveTab] = useState('discover');

  /* ── Search state ────────────────────── */
  const [searchInput,  setSearchInput]  = useState('');
  const [searchQuery,  setSearchQuery]  = useState('');   // debounced
  const [roleFilter,   setRoleFilter]   = useState('');
  const [deptFilter,   setDeptFilter]   = useState('');
  const [batchFilter,  setBatchFilter]  = useState('');
  const [showFilters,  setShowFilters]  = useState(false);
  const debounceRef = useRef(null);

  /* ── Search results ──────────────────── */
  const [searchResults,  setSearchResults]  = useState([]);
  const [searchLoading,  setSearchLoading]  = useState(false);
  const isSearchMode = searchQuery.trim() || roleFilter || deptFilter || batchFilter;

  /* ── Discovery data ──────────────────── */
  const [suggestedAlumni,   setSuggestedAlumni]   = useState([]);
  const [suggestedStudents, setSuggestedStudents] = useState([]);
  const [myConnections,     setMyConnections]     = useState([]);
  const [pendingRequests,   setPendingRequests]   = useState([]);
  const [loading, setLoading] = useState({ discover: true, connections: false, pending: false });
  const [actionLoading, setActionLoading] = useState(null);
  const [connectedSet,  setConnectedSet]  = useState(new Set()); // IDs of confirmed connections

  const navigate = useNavigate();

  /* ── Load pending count on mount (for dot badge) ── */
  useEffect(() => {
    connectionService.getRequests()
      .then(r => setPendingRequests(r.data?.data || []))
      .catch(() => {});
  }, []);

  /* ── Load connections once (to reflect in search) ── */
  useEffect(() => {
    connectionService.getMyConnections()
      .then(r => {
        const data = r.data?.data || [];
        setMyConnections(data);
        setConnectedSet(new Set(data.map(u => u._id)));
      })
      .catch(() => {});
  }, []);

  /* ── Load initial discover tab ── */
  useEffect(() => {
    if (activeTab === 'discover') fetchSuggestions();
    if (activeTab === 'connections') fetchMyConnectionsTab();
    if (activeTab === 'pending') fetchRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  /* ── Debounce search input → searchQuery ── */
  const handleSearchInput = useCallback((val) => {
    setSearchInput(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setSearchQuery(val), 350);
  }, []);

  /* ── Fire search when query or filters change ── */
  useEffect(() => {
    if (!isSearchMode) { setSearchResults([]); return; }
    runSearch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, roleFilter, deptFilter, batchFilter]);

  const runSearch = async () => {
    setSearchLoading(true);
    try {
      const params = { limit: 30 };
      if (searchQuery.trim()) params.q = searchQuery.trim();
      if (roleFilter)  params.role       = roleFilter;
      if (deptFilter)  params.department = deptFilter;
      if (batchFilter) params.batch      = batchFilter;
      const res = await userService.searchUsers(params);
      setSearchResults(res.data?.data || []);
    } catch {
      toast.error('Search failed. Please try again.');
    } finally {
      setSearchLoading(false);
    }
  };

  /* ── Data fetchers ── */
  const fetchSuggestions = async () => {
    setLoading(p => ({ ...p, discover: true }));
    try {
      const [alumniRes, stdRes] = await Promise.all([
        connectionService.getSuggestions({ role: 'alumni', limit: 20 }),
        connectionService.getSuggestions({ role: 'student', limit: 20 }),
      ]);
      setSuggestedAlumni(alumniRes.data?.data || []);
      setSuggestedStudents(stdRes.data?.data || []);
    } catch {
      toast.error('Failed to load suggestions');
    } finally {
      setLoading(p => ({ ...p, discover: false }));
    }
  };

  const fetchMyConnectionsTab = async () => {
    setLoading(p => ({ ...p, connections: true }));
    try {
      const res = await connectionService.getMyConnections();
      const data = res.data?.data || [];
      setMyConnections(data);
      setConnectedSet(new Set(data.map(u => u._id)));
    } catch {
      toast.error('Failed to load connections');
    } finally {
      setLoading(p => ({ ...p, connections: false }));
    }
  };

  const fetchRequests = async () => {
    setLoading(p => ({ ...p, pending: true }));
    try {
      const res = await connectionService.getRequests();
      setPendingRequests(res.data?.data || []);
    } catch {
      toast.error('Failed to load pending requests');
    } finally {
      setLoading(p => ({ ...p, pending: false }));
    }
  };

  /* ── Actions ── */
  const handleConnect = async (userId) => {
    setActionLoading(userId);
    try {
      await connectionService.sendRequest(userId);
      toast.success('Connection request sent!');
      setSuggestedAlumni(prev  => prev.filter(u => u._id !== userId));
      setSuggestedStudents(prev => prev.filter(u => u._id !== userId));
      // Remove from search results list too
      setSearchResults(prev => prev.filter(u => u._id !== userId));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send request');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRequestAction = async (requestId, action) => {
    setActionLoading(requestId);
    try {
      if (action === 'accept') {
        await connectionService.acceptRequest(requestId);
        toast.success('Connection accepted!');
      } else {
        await connectionService.rejectRequest(requestId);
        toast.success('Request ignored.');
      }
      setPendingRequests(prev => prev.filter(r => r._id !== requestId));
    } catch {
      toast.error(`Failed to ${action} request`);
    } finally {
      setActionLoading(null);
    }
  };

  const clearSearch = () => {
    setSearchInput('');
    setSearchQuery('');
    setRoleFilter('');
    setDeptFilter('');
    setBatchFilter('');
    setShowFilters(false);
    setSearchResults([]);
  };

  /* ─────────────────────────────────────────────────────────────
     RENDER
  ───────────────────────────────────────────────────────────── */
  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '16px 16px 80px' }}>

      {/* ── PAGE HEADER + TAB BAR ── */}
      <div style={{ marginBottom: 20, display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', gap: 12, justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontWeight: 900, fontSize: 22, color: '#111827', margin: 0, letterSpacing: '-0.4px' }}>My Network</h1>
          <p style={{ color: '#6b7280', fontSize: 13, margin: '4px 0 0' }}>Discover and connect with alumni and students.</p>
        </div>

        {/* Tab switcher */}
        <div style={{ display: 'flex', background: '#fff', border: '1.5px solid #e5e7eb', borderRadius: 10, padding: 4, gap: 2, flexShrink: 0 }}>
          {[
            { key: 'discover',    label: 'Discover',       icon: <FiSearch size={14} /> },
            { key: 'connections', label: 'My Connections',  icon: <FiUsers size={14} /> },
            { key: 'pending',     label: 'Pending',         icon: <FiClock size={14} />, badge: pendingRequests.length },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '7px 14px', borderRadius: 8, border: 'none', cursor: 'pointer',
                fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', position: 'relative',
                background: activeTab === t.key ? '#fef2f2' : 'transparent',
                color:      activeTab === t.key ? '#b91c1c' : '#4b5563',
                transition: '0.15s',
              }}
            >
              {t.icon}
              {t.label}
              {t.badge > 0 && activeTab !== t.key && (
                <span style={{ position: 'absolute', top: 6, right: 8, width: 8, height: 8, background: '#dc2626', borderRadius: '50%' }} />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── SEARCH BAR + FILTERS Strip ── */}
      <div style={{ background: '#fff', border: '1.5px solid #e5e7eb', borderRadius: 12, marginBottom: 24, boxShadow: '0 1px 4px rgba(0,0,0,.05)' }}>
        {/* Search row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px' }}>
          <FiSearch size={17} color="#9ca3af" style={{ flexShrink: 0 }} />
          <input
            value={searchInput}
            onChange={e => handleSearchInput(e.target.value)}
            placeholder="Search by name, company, department, batch…"
            style={{
              flex: 1, border: 'none', outline: 'none',
              fontSize: 14, color: '#111827', background: 'transparent',
              fontFamily: 'inherit',
            }}
          />
          {/* Filter toggle */}
          <button
            onClick={() => setShowFilters(v => !v)}
            style={{
              display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px',
              border: `1.5px solid ${showFilters || roleFilter || deptFilter || batchFilter ? '#c84022' : '#e5e7eb'}`,
              borderRadius: 8, background: showFilters || roleFilter || deptFilter || batchFilter ? '#fff5f5' : '#fff',
              color: showFilters || roleFilter || deptFilter || batchFilter ? '#c84022' : '#6b7280',
              fontWeight: 600, fontSize: 12, cursor: 'pointer', transition: '0.15s', flexShrink: 0
            }}
          >
            <FiFilter size={13} /> Filters <FiChevronDown size={12} style={{ transform: showFilters ? 'rotate(180deg)' : 'none', transition: '.2s' }} />
            {(roleFilter || deptFilter || batchFilter) && (
              <span style={{ background: '#c84022', color: '#fff', borderRadius: '50%', width: 16, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700 }}>
                {[roleFilter, deptFilter, batchFilter].filter(Boolean).length}
              </span>
            )}
          </button>
          {/* Clear all */}
          {(searchInput || roleFilter || deptFilter || batchFilter) && (
            <button
              onClick={clearSearch}
              style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#9ca3af', display: 'flex', padding: 4 }}
            >
              <FiX size={16} />
            </button>
          )}
        </div>

        {/* Filter pills row */}
        {showFilters && (
          <div style={{ borderTop: '1px solid #f3f4f6', padding: '12px 14px', display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            {/* Role */}
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '.4px', marginBottom: 4, display: 'block' }}>Role</label>
              <div style={{ display: 'flex', gap: 6 }}>
                {['', 'alumni', 'student'].map(r => (
                  <button
                    key={r}
                    onClick={() => setRoleFilter(r)}
                    style={{
                      padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                      border: `1.5px solid ${roleFilter === r ? '#c84022' : '#e5e7eb'}`,
                      background: roleFilter === r ? '#fef2f2' : '#fff',
                      color: roleFilter === r ? '#c84022' : '#4b5563',
                      cursor: 'pointer', textTransform: r ? 'capitalize' : undefined
                    }}
                  >
                    {r || 'All'}
                  </button>
                ))}
              </div>
            </div>

            {/* Department */}
            <div style={{ flex: 1, minWidth: 200 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '.4px', marginBottom: 4, display: 'block' }}>Department</label>
              <select
                value={deptFilter}
                onChange={e => setDeptFilter(e.target.value)}
                style={{ width: '100%', padding: '5px 10px', borderRadius: 8, border: '1.5px solid #e5e7eb', fontSize: 12.5, color: '#374151', background: '#fff', fontFamily: 'inherit', outline: 'none' }}
              >
                <option value="">All Departments</option>
                {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>

            {/* Batch year */}
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '.4px', marginBottom: 4, display: 'block' }}>Batch Year</label>
              <input
                type="number"
                placeholder="e.g. 2024"
                value={batchFilter}
                onChange={e => setBatchFilter(e.target.value)}
                style={{ width: 110, padding: '5px 10px', borderRadius: 8, border: '1.5px solid #e5e7eb', fontSize: 12.5, color: '#374151', background: '#fff', fontFamily: 'inherit', outline: 'none' }}
              />
            </div>
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════
          SEARCH MODE — unified results list
      ══════════════════════════════════════════════════════════ */}
      {isSearchMode && (
        <div style={{ background: '#fff', border: '1.5px solid #e5e7eb', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 6px rgba(0,0,0,.06)' }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontWeight: 700, fontSize: 14, color: '#111827' }}>
              {searchLoading ? 'Searching…' : `${searchResults.length} result${searchResults.length !== 1 ? 's' : ''}`}
            </span>
            <button onClick={clearSearch} style={{ border: 'none', background: 'none', color: '#9ca3af', fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>Clear search</button>
          </div>

          {searchLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600" />
            </div>
          ) : searchResults.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 24px', color: '#9ca3af' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>🔍</div>
              <div style={{ fontWeight: 700, color: '#374151', fontSize: 15 }}>No users found</div>
              <div style={{ fontSize: 13, marginTop: 4 }}>Try different keywords or clear some filters.</div>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {searchResults.map(user => (
                <SearchResultRow
                  key={user._id}
                  user={user}
                  onConnect={handleConnect}
                  actionLoading={actionLoading}
                  connectedIds={connectedSet}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          DISCOVER TAB
      ══════════════════════════════════════════════════════════ */}
      {!isSearchMode && activeTab === 'discover' && (
        <div className="space-y-8">
          {loading.discover ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600" />
            </div>
          ) : (
            <>
              {/* Suggested Alumni */}
              <section>
                <h2 style={{ fontWeight: 800, fontSize: 16, color: '#111827', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                  <span style={{ width: 28, height: 28, borderRadius: 8, background: '#fef2f2', color: '#c84022', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13 }}>
                    <FiUsers />
                  </span>
                  Suggested Alumni
                </h2>
                {suggestedAlumni.length === 0 ? (
                  <div style={{ background: '#fafafa', border: '1px solid #f3f4f6', borderRadius: 12, padding: '28px 16px', textAlign: 'center', color: '#9ca3af', fontSize: 14 }}>
                    No new alumni suggestions right now.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {suggestedAlumni.map(u => (
                      <UserCard key={u._id} user={u} type="suggestion" onAction={handleConnect} actionLoading={actionLoading} connected={connectedSet.has(u._id)} />
                    ))}
                  </div>
                )}
              </section>

              <hr style={{ borderColor: '#f3f4f6' }} />

              {/* Suggested Students */}
              <section>
                <h2 style={{ fontWeight: 800, fontSize: 16, color: '#111827', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                  <span style={{ width: 28, height: 28, borderRadius: 8, background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13 }}>
                    <FiUsers />
                  </span>
                  Suggested Students
                </h2>
                {suggestedStudents.length === 0 ? (
                  <div style={{ background: '#fafafa', border: '1px solid #f3f4f6', borderRadius: 12, padding: '28px 16px', textAlign: 'center', color: '#9ca3af', fontSize: 14 }}>
                    No new student suggestions right now.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {suggestedStudents.map(u => (
                      <UserCard key={u._id} user={u} type="suggestion" onAction={handleConnect} actionLoading={actionLoading} connected={connectedSet.has(u._id)} />
                    ))}
                  </div>
                )}
              </section>
            </>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          MY CONNECTIONS TAB
      ══════════════════════════════════════════════════════════ */}
      {!isSearchMode && activeTab === 'connections' && (
        <div>
          {loading.connections ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600" />
            </div>
          ) : myConnections.length === 0 ? (
            <div style={{ background: '#fff', border: '1.5px solid #e5e7eb', borderRadius: 16, padding: '48px 24px', textAlign: 'center' }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#f9fafb', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', color: '#9ca3af' }}>
                <FiUserCheck size={28} />
              </div>
              <h3 style={{ fontWeight: 800, fontSize: 16, color: '#111827' }}>No connections yet</h3>
              <p style={{ color: '#6b7280', fontSize: 13, marginTop: 6, maxWidth: 320, margin: '6px auto 0' }}>
                Use the search bar or Discover tab to find people and send connection requests.
              </p>
              <button onClick={() => setActiveTab('discover')} style={{ marginTop: 16, padding: '8px 20px', background: '#c84022', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                Discover People
              </button>
            </div>
          ) : (
            <>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#6b7280', marginBottom: 14 }}>{myConnections.length} Connection{myConnections.length !== 1 ? 's' : ''}</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {myConnections.map(u => <UserCard key={u._id} user={u} type="connection" />)}
              </div>
            </>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          PENDING REQUESTS TAB
      ══════════════════════════════════════════════════════════ */}
      {!isSearchMode && activeTab === 'pending' && (
        <div>
          {loading.pending ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600" />
            </div>
          ) : pendingRequests.length === 0 ? (
            <div style={{ background: '#fff', border: '1.5px solid #e5e7eb', borderRadius: 16, padding: '48px 24px', textAlign: 'center' }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#f9fafb', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', color: '#9ca3af' }}>
                <FiClock size={28} />
              </div>
              <h3 style={{ fontWeight: 800, fontSize: 16, color: '#111827' }}>All caught up!</h3>
              <p style={{ color: '#6b7280', fontSize: 13, marginTop: 6 }}>No pending connection invitations.</p>
            </div>
          ) : (
            <div style={{ background: '#fff', border: '1.5px solid #e5e7eb', borderRadius: 14, overflow: 'hidden', maxWidth: 720 }}>
              <div style={{ padding: '14px 18px', borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 800, fontSize: 15, color: '#111827' }}>Pending Invitations</span>
                <span style={{ background: '#fef2f2', color: '#c84022', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20 }}>{pendingRequests.length}</span>
              </div>
              <div className="divide-y divide-gray-100">
                {pendingRequests.map(req => (
                  <div key={req._id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px' }} className="hover:bg-gray-50 transition">
                    <img
                      src={req.sender?.profilePic || `https://ui-avatars.com/api/?name=${encodeURIComponent(req.sender?.name || '?')}&background=fee2e2&color=c84022`}
                      alt="avatar"
                      style={{ width: 52, height: 52, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: '2px solid #fff', boxShadow: '0 1px 4px rgba(0,0,0,.1)', cursor: 'pointer' }}
                      onClick={() => navigate(`/profile/${req.sender?._id}`)}
                      onError={e => { e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(req.sender?.name || '?')}`; }}
                    />
                    <div style={{ flex: 1, minWidth: 0, cursor: 'pointer' }} onClick={() => navigate(`/profile/${req.sender?._id}`)}>
                      <div style={{ fontWeight: 700, fontSize: 14, color: '#111827' }}>{req.sender?.name}</div>
                      <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2, textTransform: 'capitalize' }}>
                        {req.sender?.role} · {req.sender?.department || '—'}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                      <button
                        disabled={actionLoading === req._id}
                        onClick={() => handleRequestAction(req._id, 'reject')}
                        style={{ width: 36, height: 36, borderRadius: '50%', border: '1.5px solid #e5e7eb', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280', opacity: actionLoading === req._id ? 0.5 : 1 }}
                        title="Ignore"
                      >
                        <FiX size={15} />
                      </button>
                      <button
                        disabled={actionLoading === req._id}
                        onClick={() => handleRequestAction(req._id, 'accept')}
                        style={{ padding: '0 16px', height: 36, borderRadius: 20, background: '#c84022', color: '#fff', border: 'none', fontWeight: 700, fontSize: 13, cursor: 'pointer', opacity: actionLoading === req._id ? 0.5 : 1 }}
                      >
                        Accept
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
};

export default Network;
