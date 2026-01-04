import React from 'react';

const DashboardOverview = () => {
    return (
        <div className="animate__animated animate__fadeIn">
            <h2 className="text-center brand-red-text fw-bold mb-1">DASHBOARD</h2>
            <p className="text-center text-muted small mb-4">OVERVIEW</p>
            
            {/* 1. piechart */}
            <div className="row g-3 justify-content-center mb-5">
                <div className="col-md-3">
                    <div className="card border-0 shadow-sm p-3 text-center rounded-4">
                        <p className="extra-small text-muted mb-1 small">TOTAL ALUMNI</p>
                        <h3 className="fw-bold mb-0">1250</h3>
                    </div>
                </div>
                <div className="col-md-3">
                    <div className="card border-0 shadow-sm p-3 text-center rounded-4">
                        <p className="extra-small text-muted mb-1 small">TOTAL STUDENTS</p>
                        <h3 className="fw-bold mb-0">3504</h3>
                    </div>
                </div>
                <div className="col-md-3">
                    <div className="card border-0 shadow-sm p-3 text-center rounded-4">
                        <p className="extra-small text-muted mb-1 small">TOTAL USERS</p>
                        <h3 className="fw-bold mb-0">7059</h3>
                    </div>
                </div>
            </div>

            {/* 2.drawing */}
            <div className="row align-items-center justify-content-center mb-5">
                <div className="col-md-5 text-center">
                    <div className="pie-chart-placeholder mx-auto" style={{
                        width: '250px', height: '250px', borderRadius: '50%', 
                        background: 'conic-gradient(#46C2CB 0% 60%, #E966A0 60% 85%, #9376E1 85% 100%)'
                    }}></div>
                </div>
                <div className="col-md-3">
                    <div className="d-flex flex-column gap-3 small fw-bold">
                        <div className="d-flex align-items-center gap-2">
                            <div style={{width:'20px', height:'20px', backgroundColor:'#46C2CB', borderRadius:'4px'}}></div> STUDENTS
                        </div>
                        <div className="d-flex align-items-center gap-2">
                            <div style={{width:'20px', height:'20px', backgroundColor:'#E966A0', borderRadius:'4px'}}></div> ALUMNI
                        </div>
                        <div className="d-flex align-items-center gap-2">
                            <div style={{width:'20px', height:'20px', backgroundColor:'#9376E1', borderRadius:'4px'}}></div> STAFFS
                        </div>
                    </div>
                </div>
            </div>


            <div className="row g-4 justify-content-center px-4">
                <div className="col-md-5">
                    <div className="card border-0 shadow-sm p-3 rounded-4 d-flex flex-row align-items-center justify-content-between overflow-hidden">
                        <div style={{ flex: '1' }}>
                            <p className="brand-red-text small fw-bold mb-1">Recent Messages</p>
                            <p className="fw-bold mb-0 small">5 New Messages</p>
                            <p className="extra-small text-muted mb-0 small">Review and respond to recent contact form submission</p>
                        </div>
                        <div className="ms-3 bg-secondary-subtle rounded-3 d-flex align-items-center justify-content-center" style={{ width: '100px', height: '70px' }}>
                            <span className="extra-small text-muted">Image</span>
                        </div>
                    </div>
                </div>
                <div className="col-md-5">
                    <div className="card border-0 shadow-sm p-3 rounded-4 d-flex flex-row align-items-center justify-content-between overflow-hidden">
                        <div style={{ flex: '1' }}>
                            <p className="brand-red-text small fw-bold mb-1">Pending Verifications</p>
                            <p className="fw-bold mb-0 small">10 Users</p>
                            <p className="extra-small text-muted mb-0 small">Verify new users accounts to ensure authenticity</p>
                        </div>
                        <div className="ms-3 bg-secondary-subtle rounded-3 d-flex align-items-center justify-content-center" style={{ width: '100px', height: '70px' }}>
                            <span className="extra-small text-muted">Image</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardOverview;