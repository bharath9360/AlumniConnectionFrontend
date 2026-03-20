import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { authService, connectionService, chatService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { ClipLoader } from 'react-spinners';
import { FiMessageCircle, FiUserPlus, FiUserCheck, FiUserX, FiBriefcase, FiMapPin, FiBook, FiUsers } from 'react-icons/fi';

const PublicProfile = () => {
  const { id } = useParams();
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [connStatus, setConnStatus] = useState('none'); // none | Pending | Accepted
  const [connLoading, setConnLoading] = useState(false);
  const [msgLoading, setMsgLoading] = useState(false);

  const fetchProfile = useCallback(async () => {
    try {
      const [profileRes, statusRes] = await Promise.all([
        authService.getUserById(id),
        currentUser ? connectionService.getStatus(id).catch(() => ({ data: { status: 'none' } })) : Promise.resolve({ data: { status: 'none' } })
      ]);
      setProfile(profileRes.data.data);
      setConnStatus(statusRes.data.status);
    } catch (err) {
      toast.error('Could not load profile.');
    } finally {
      setLoading(false);
    }
  }, [id, currentUser]);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  const handleConnect = async () => {
    if (!currentUser) return navigate('/login');
    setConnLoading(true);
    try {
      if (connStatus === 'Accepted') {
        await connectionService.removeConnection(id);
        setConnStatus('none');
        toast.success('Connection removed.');
      } else if (connStatus === 'Pending') {
        toast('Connection request already sent! ⏳');
      } else {
        await connectionService.sendRequest(id);
        setConnStatus('Pending');
        toast.success('Connection request sent! 🤝');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed. Try again.');
    } finally {
      setConnLoading(false);
    }
  };

  const handleMessage = async () => {
    if (!currentUser) return navigate('/login');
    setMsgLoading(true);
    try {
      await chatService.accessChat(id);
      navigate('/messaging');
    } catch (err) {
      toast.error('Could not open chat.');
    } finally {
      setMsgLoading(false);
    }
  };

  const roleColor = (role) => {
    if (role === 'admin') return '#0d6efd';
    if (role === 'alumni') return '#c84022';
    return '#198754';
  };

  if (loading) return (
    <div className="d-flex justify-content-center align-items-center min-vh-100">
      <ClipLoader color="#c84022" size={48} />
    </div>
  );

  if (!profile) return (
    <div className="d-flex justify-content-center align-items-center min-vh-100">
      <div className="text-center">
        <h3>Profile not found</h3>
        <Link to="/" className="btn btn-outline-secondary mt-3">Go Home</Link>
      </div>
    </div>
  );

  const isMe = currentUser?._id === id;
  const acceptedConnections = (profile.connections || []).filter(c => c.status === 'Accepted').length;

  return (
    <div style={{ backgroundColor: '#f3f2ef', minHeight: '100vh', paddingBottom: '40px' }}>
      <div className="container" style={{ maxWidth: '860px', paddingTop: '24px' }}>

        {/* Profile Card */}
        <div className="bg-white rounded-3 overflow-hidden shadow-sm mb-3">
          {/* Cover */}
          <div style={{
            height: '140px',
            background: profile.coverPic
              ? `url(${profile.coverPic}) center/cover`
              : 'linear-gradient(135deg, #c84022, #e85a3a)',
            position: 'relative'
          }}></div>

          <div className="px-4 pb-4">
            {/* Avatar */}
            <div style={{ marginTop: '-50px', marginBottom: '12px' }}>
              <div className="rounded-circle overflow-hidden border-4 border-white d-inline-flex align-items-center justify-content-center bg-light"
                style={{ width: '100px', height: '100px', border: '4px solid white', fontSize: '2.5rem', fontWeight: 'bold', color: '#c84022', backgroundColor: '#fde8e3' }}>
                {profile.profilePic
                  ? <img src={profile.profilePic} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : profile.name?.charAt(0).toUpperCase()
                }
              </div>
            </div>

            {/* Name & Role */}
            <div className="d-flex justify-content-between align-items-start flex-wrap gap-2">
              <div>
                <h3 className="fw-bold mb-1">{profile.name}</h3>
                <span className="badge rounded-pill px-3 py-1" style={{ backgroundColor: roleColor(profile.role), color: 'white', fontSize: '0.75rem' }}>
                  {profile.role?.toUpperCase()}
                </span>
                {profile.designation && <p className="text-muted mb-1 mt-1" style={{ fontSize: '0.95rem' }}>{profile.designation}{profile.company ? ` at ${profile.company}` : ''}</p>}
                {profile.department && <p className="text-muted mb-0" style={{ fontSize: '0.85rem' }}><FiBook className="me-1" />{profile.department} {profile.batch ? `• Batch ${profile.batch}` : ''}</p>}
                {profile.city && <p className="text-muted mb-0" style={{ fontSize: '0.85rem' }}><FiMapPin className="me-1" />{profile.city}{profile.state ? `, ${profile.state}` : ''}</p>}
              </div>

              {!isMe && (
                <div className="d-flex gap-2 flex-wrap">
                  <button
                    className="btn px-4 d-flex align-items-center gap-2"
                    style={{ backgroundColor: connStatus === 'Accepted' ? '#e8f4fd' : '#c84022', color: connStatus === 'Accepted' ? '#0b66c2' : 'white', borderRadius: '20px', fontWeight: 600, fontSize: '0.85rem', border: 'none' }}
                    onClick={handleConnect}
                    disabled={connLoading}
                  >
                    {connLoading ? <ClipLoader size={14} color="currentColor" /> :
                      connStatus === 'Accepted' ? <><FiUserCheck /> Connected</> :
                      connStatus === 'Pending' ? <><FiUserX /> Pending</> :
                      <><FiUserPlus /> Connect</>}
                  </button>
                  <button
                    className="btn px-4 d-flex align-items-center gap-2"
                    style={{ backgroundColor: 'white', color: '#c84022', border: '2px solid #c84022', borderRadius: '20px', fontWeight: 600, fontSize: '0.85rem' }}
                    onClick={handleMessage}
                    disabled={msgLoading}
                  >
                    {msgLoading ? <ClipLoader size={14} color="#c84022" /> : <><FiMessageCircle /> Message</>}
                  </button>
                </div>
              )}
            </div>

            {/* Connection count */}
            <p className="mt-2 mb-0" style={{ fontSize: '0.85rem', color: '#0b66c2', fontWeight: 500 }}>
              <FiUsers className="me-1" />{acceptedConnections} connection{acceptedConnections !== 1 ? 's' : ''}
            </p>

            {/* Bio */}
            {profile.bio && <p className="mt-3 text-dark" style={{ fontSize: '0.95rem', lineHeight: 1.6 }}>{profile.bio}</p>}
          </div>
        </div>

        {/* Skills */}
        {profile.skills?.length > 0 && (
          <div className="bg-white rounded-3 shadow-sm p-4 mb-3">
            <h5 className="fw-bold mb-3">Skills</h5>
            <div className="d-flex flex-wrap gap-2">
              {profile.skills.map((skill, i) => (
                <span key={i} className="badge rounded-pill px-3 py-2" style={{ backgroundColor: '#fff5f5', color: '#c84022', border: '1px solid #f5c6bb', fontSize: '0.82rem' }}>
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Experience */}
        {profile.experience?.length > 0 && (
          <div className="bg-white rounded-3 shadow-sm p-4 mb-3">
            <h5 className="fw-bold mb-3"><FiBriefcase className="me-2" />Experience</h5>
            {profile.experience.map((exp, i) => (
              <div key={i} className="border-start border-2 ps-3 mb-3" style={{ borderColor: '#c84022' }}>
                <h6 className="fw-semibold mb-0">{exp.title}</h6>
                <p className="text-muted mb-0" style={{ fontSize: '0.85rem' }}>{exp.company} • {exp.duration}</p>
                {exp.desc && <p className="text-muted mt-1" style={{ fontSize: '0.85rem' }}>{exp.desc}</p>}
              </div>
            ))}
          </div>
        )}

        {/* Education */}
        {profile.education?.length > 0 && (
          <div className="bg-white rounded-3 shadow-sm p-4 mb-3">
            <h5 className="fw-bold mb-3"><FiBook className="me-2" />Education</h5>
            {profile.education.map((edu, i) => (
              <div key={i} className="border-start border-2 ps-3 mb-3" style={{ borderColor: '#c84022' }}>
                <h6 className="fw-semibold mb-0">{edu.school}</h6>
                <p className="text-muted mb-0" style={{ fontSize: '0.85rem' }}>{edu.degree} • {edu.duration}</p>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
};

export default PublicProfile;
