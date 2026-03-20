import React from 'react';
import { Link } from 'react-router-dom';
const ProfileCard = ({ user }) => {
    return (
        <div className="dashboard-card bg-white shadow-sm overflow-hidden mb-4 rounded-3 border-0">
            <div className="profile-card-header bg-mamcet-red" style={{ height: '60px' }}></div>
            <div className="text-center px-3 pb-3" style={{ marginTop: '-30px' }}>
                <Link to="/alumni/profile" className="text-decoration-none">
                    <div className="avatar-md mx-auto bg-white border rounded-circle d-flex align-items-center justify-content-center shadow-sm"
                        style={{ width: '72px', height: '72px', overflow: 'hidden' }}>
                        {user?.profilePic ? (
                            <img src={user.profilePic} alt={user.name} className="w-100 h-100 object-fit-cover" />
                        ) : (
                            <span className="fs-3 fw-bold text-mamcet-red">{user?.name?.[0] || "?"}</span>
                        )}
                    </div>
                    <h6 className="fw-bold mt-2 mb-0 text-dark">{user?.name || "Anonymous"}</h6>
                </Link>
                <p className="extra-small text-muted mb-3">{user.role} at {user.company}</p>

                <div className="divider-line my-2"></div>

                <div className="text-start">
                    <div className="d-flex justify-content-between align-items-center py-1 hover-bg-light rounded cursor-pointer">
                        <span className="extra-small text-muted fw-bold">Profile viewers</span>
                        <span className="extra-small text-mamcet-red fw-bold">{user.views}</span>
                    </div>
                    <div className="d-flex justify-content-between align-items-center py-1 hover-bg-light rounded cursor-pointer">
                        <span className="extra-small text-muted fw-bold">Connections</span>
                        <span className="extra-small text-mamcet-red fw-bold">{user.connections}</span>
                    </div>
                </div>

                <div className="divider-line my-2"></div>

                <div className="text-start mt-2">
                    <Link to="/jobs" className="d-flex align-items-center text-decoration-none py-1 text-muted hover-bg-light rounded">
                        <i className="fas fa-bookmark me-2 text-mamcet-red extra-small"></i>
                        <span className="extra-small fw-bold">My items</span>
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default ProfileCard;
