import React from 'react';
import AdminNavbar from '../../components/admin/AdminNavbar';

const AdminHome = () => {
    return (
        <div style={{ backgroundColor: '#fff', minHeight: '100vh' }}>
            <AdminNavbar />
            {/* marginTop-ஐ 150px-லிருந்து 60px-ஆக குறைத்துள்ளேன், அதனால் கன்டென்ட் மேலே ஏறும் */}
            <div className="container" style={{ marginTop: '60px' }}>
                <div className="text-center">
                    <h1 className="fw-bold" style={{ color: '#b22222', fontSize: '2.5rem', marginBottom: '10px' }}>
                        WELCOME HOME
                    </h1>
                    <div style={{ height: '2px', width: '50px', backgroundColor: '#b22222', margin: '0 auto 15px' }}></div>
                    <p className="text-muted fw-bold" style={{ letterSpacing: '1px', fontSize: '14px' }}>
                        ADMIN PANEL ACTIVE
                    </p>
                </div>
            </div>
        </div>
    );
};

export default AdminHome;