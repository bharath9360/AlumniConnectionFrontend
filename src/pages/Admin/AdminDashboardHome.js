import React from 'react';
import Sidebar from '../../components/admin/Sidebar';
import AdminNavbar from '../../components/admin/AdminNavbar';
import '../../styles/Admin.css'; // New CSS file for Admin

const AdminDashboard = () => {
  // DUMMY DATA FOR STATISTICS
  const statsData = [
    { id: 1, title: "Total Alumni", count: "5,420", icon: "fa-user-graduate", color: "primary" },
    { id: 2, title: "Students Registered", count: "1,250", icon: "fa-users", color: "success" },
    { id: 3, title: "Events Hosted", count: "45", icon: "fa-calendar-check", color: "warning" },
    { id: 4, title: "Jobs Posted", count: "128", icon: "fa-briefcase", color: "danger" },
  ];

  // DUMMY DATA FOR RECENT REGISTRATIONS TABLE
  const recentRegistrations = [
    { id: 101, name: "Karthik Raja", batch: "2023", type: "Alumni", status: "Verified" },
    { id: 102, name: "Priya Dharshini", batch: "2025", type: "Student", status: "Pending" },
    { id: 103, name: "Amit Kumar", batch: "2020", type: "Alumni", status: "Verified" },
    { id: 104, name: "Sara Ali", batch: "2024", type: "Student", status: "Pending" },
    { id: 105, name: "Rahul Dravid", batch: "2018", type: "Alumni", status: "Verified" },
  ];

  return (
    <div className="admin-wrapper d-flex">
      {/* Sidebar fixed on left */}
      <Sidebar />
      
      {/* Main Content Area */}
      <div className="admin-content flex-grow-1 bg-light">
        <AdminNavbar />
        
        <div className="container-fluid p-4">
          {/* Statistics Cards Row */}
          <div className="row g-4 mb-4">
            {statsData.map(stat => (
              <div key={stat.id} className="col-md-3">
                <div className="card border-0 shadow-sm h-100">
                  <div className="card-body d-flex justify-content-between align-items-center">
                    <div>
                      <h6 className="text-muted mb-2">{stat.title}</h6>
                      <h3 className="fw-bold mb-0">{stat.count}</h3>
                    </div>
                    <div className={`icon-box bg-${stat.color}-soft text-${stat.color}`}>
                      <i className={`fas ${stat.icon} fs-4`}></i>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Recent Registrations Table */}
          <div className="card border-0 shadow-sm mb-4">
            <div className="card-header bg-white py-3 d-flex justify-content-between align-items-center">
              <h5 className="mb-0 fw-bold">Recent Registrations</h5>
              <button className="btn btn-sm btn-outline-primary">View All</button>
            </div>
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="bg-light">
                    <tr>
                      <th scope="col" className="ps-4">ID</th>
                      <th scope="col">Name</th>
                      <th scope="col">Batch</th>
                      <th scope="col">Type</th>
                      <th scope="col">Status</th>
                      <th scope="col" className="text-end pe-4">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentRegistrations.map(reg => (
                      <tr key={reg.id}>
                        <td className="ps-4 text-muted">#{reg.id}</td>
                        <td className="fw-bold">{reg.name}</td>
                        <td>{reg.batch}</td>
                        <td>
                            <span className={`badge ${reg.type === 'Alumni' ? 'bg-primary' : 'bg-info'}`}>
                                {reg.type}
                            </span>
                        </td>
                        <td>
                          <span className={`badge ${reg.status === 'Verified' ? 'bg-success' : 'bg-warning text-dark'}`}>
                            {reg.status}
                          </span>
                        </td>
                        <td className="text-end pe-4">
                          <button className="btn btn-sm btn-light text-primary me-2"><i className="fas fa-eye"></i></button>
                          {reg.status === 'Pending' && <button className="btn btn-sm btn-light text-success"><i className="fas fa-check"></i> Verify</button>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;