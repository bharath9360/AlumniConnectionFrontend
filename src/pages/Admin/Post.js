import React, { useState } from 'react';

const Post = () => {
    const [postStep, setPostStep] = useState('CATEGORIES');
    
    const [jobs, setJobs] = useState([
        { id: 1, title: "Social Media Assistant", time: "2 days ago", desc: "Assist in managing social media accounts, creating content..." },
        { id: 2, title: "Administrative Assistant", time: "5 days ago", desc: "Provide administrative support to the department..." },
        { id: 3, title: "Event Co-ordinator", time: "1 week ago", desc: "Assist in planning and executing campus events..." },
        { id: 4, title: "IT Support Specialist", time: "2 week ago", desc: "Provide technical support to students and faculty..." },
        { id: 5, title: "Research Assistant", time: "3 week ago", desc: "Assist in conducting research projects, including data collection..." }
    ]);

    const handlePostJob = () => {
        const newJob = {
            id: jobs.length + 1,
            title: "New Job Opportunity",
            time: "Just now",
            desc: "This is the newly created job description from the form."
        };
        setJobs([newJob, ...jobs]);
        setPostStep('JOB_LIST');
    };

    return (
        <div className="post-container animate__animated animate__fadeIn">
            
            {/* 1. CATEGORIES PAGE */}
            {postStep === 'CATEGORIES' && (
                <div className="text-center">
                    <h3 className="brand-red-text fw-bold mb-4">POST'S BY CATEGORY</h3>
                    <div className="d-flex justify-content-center gap-5 mb-5">
                        <div onClick={() => setPostStep('JOB_LIST')} className="category-card p-4 border rounded-4 bg-white shadow-sm cursor-pointer" style={{width: '180px'}}>
                            <img src="https://cdn-icons-png.flaticon.com/512/3850/3850285.png" width="70" alt="Job" />
                            <p className="fw-bold mt-2 mb-0">JOB VACANCY</p>
                        </div>
                        <div onClick={() => setPostStep('EVENT_LIST')} className="category-card p-4 border rounded-4 bg-white shadow-sm cursor-pointer" style={{width: '180px'}}>
                            <img src="https://cdn-icons-png.flaticon.com/512/3652/3652191.png" width="70" alt="Event" />
                            <p className="fw-bold mt-2 mb-0">UPCOMING EVENTS</p>
                        </div>
                    </div>

                    <h5 className="text-muted fw-bold border-bottom pb-2 mb-4 text-start ms-4">ALL RECENT POST'S</h5>
                    <div className="recent-posts mx-auto px-4" style={{maxWidth: '850px'}}>
                        {[
    { 
        title: "Tech Alumni Mixer", 
        desc: "Join us for an evening of networking and socializing with fellow alumni in the tech industry.", 
        img: "/assets/images/Rectangle 50.png" 
    },
    { 
        title: "Annual Homecoming Celebration", 
        desc: "Celebrate the annual homecoming with a campus tour, alumni awards, and a gala dinner.", 
        img: "/assets/images/homecoming.png" 
    },
    { 
        title: "Career Development Workshop", 
        desc: "A workshop focused on resume building and interview skills for career advancement.", 
        img: "/assets/images/workshop.png" 
    },
    { 
        title: "Finance Alumni Networking Event", 
        desc: "An exclusive event for alumni in the finance sector to discuss industry trends.", 
        img: "/assets/images/finance.png" 
    }
].map((post, idx) => (
    <div key={idx} className="d-flex align-items-center justify-content-between border-bottom py-4 text-start">
        <div style={{flex: 1}}>
            <h6 className="brand-red-text fw-bold mb-1">{post.title}</h6>
            <p className="small text-muted mb-0 pe-4">{post.desc}</p>
        </div>

        <img src={post.img} className="rounded-3 shadow-sm" width="160" height="100" alt={post.title} />
    </div>
))}
                    </div>
                </div>
            )}

            {/* 2. JOB LIST */}
            {postStep === 'JOB_LIST' && (
                <div>
                    {/* BACK பட்டன் - */}
                    <button onClick={() => setPostStep('CATEGORIES')} className="btn btn-link text-dark text-decoration-none fw-bold p-0 mb-3">
                        <i className="fas fa-arrow-left me-2"></i> BACK
                    </button>
                    
                    <h3 className="text-center brand-red-text fw-bold">BASED ON JOB VACANCY</h3>
                    <div className="d-flex justify-content-center gap-3 my-4">
                        <select className="form-select w-auto rounded-pill border shadow-sm px-4"><option>Department</option></select>
                        <select className="form-select w-auto rounded-pill border shadow-sm px-4"><option>Job Type</option></select>
                        <select className="form-select w-auto rounded-pill border shadow-sm px-4"><option>Posting Date</option></select>
                    </div>

                    <div className="d-flex justify-content-between align-items-center border-bottom pb-2 mb-3">
                        <h5 className="fw-bold mb-0">JOB VACANCY POST'S</h5>
                        <button onClick={() => setPostStep('CREATE_JOB')} className="btn btn-danger rounded-pill px-4 fw-bold shadow-sm">CREATE JOB</button>
                    </div>

                    {jobs.map((job) => (
                        <div key={job.id} className="d-flex justify-content-between align-items-center py-3 border-bottom text-start">
                            <div style={{flex: 1}}>
                                <h6 className="brand-red-text fw-bold mb-1">{job.title} <span className="text-muted small fw-normal ms-2">( {job.time} )</span></h6>
                                <p className="extra-small text-muted mb-0">{job.desc}</p>
                            </div>
                            <button className="btn btn-outline-secondary btn-sm rounded-pill px-4 shadow-sm">View Detail's</button>
                        </div>
                    ))}
                </div>
            )}

            {/* 3. CREATE JOB */}
            {postStep === 'CREATE_JOB' && (
                <div className="card border-0 shadow-lg rounded-4 p-5 mx-auto" style={{maxWidth: '850px'}}>
                  
                    <button onClick={() => setPostStep('JOB_LIST')} className="btn btn-link text-dark text-decoration-none fw-bold p-0 mb-4 text-start">
                        <i className="fas fa-arrow-left me-2"></i> BACK
                    </button>
                    
                    <h3 className="text-center brand-red-text fw-bold mb-5">Create Job Opportunities</h3>
                    <div className="row g-4 text-start">
                        <div className="col-md-6">
                            <label className="fw-bold small mb-2 text-muted">JOB TITLE</label>
                            <input type="text" className="form-control bg-light border-0 py-2 rounded-3" placeholder="ENTER A JOB TITLE" />
                            <label className="fw-bold small mt-4 mb-2 text-muted">JOB DESCRIPTION</label>
                            <textarea className="form-control bg-light border-0 py-2 rounded-3" rows="5" placeholder="ENTER A JOB DESCRIPTION"></textarea>
                        </div>
                        <div className="col-md-6">
                            <label className="fw-bold small mb-2 text-muted">DATE</label>
                            <input type="date" className="form-control bg-light border-0 py-2 rounded-3" />
                            <label className="fw-bold small mt-4 mb-2 text-muted">LOCATION</label>
                            <input type="text" className="form-control bg-light border-0 py-2 rounded-3" placeholder="ENTER A LOCATION" />
                        </div>
                        <div className="col-12">
                            <label className="fw-bold small mb-2 text-muted">APPLICATION LINKS</label>
                            <input type="text" className="form-control bg-light border-0 py-2 rounded-3 mb-2" placeholder="PASTE JOB LINKS" />
                            <button className="btn btn-link p-0 text-muted text-decoration-none fw-bold small">+ ADD</button>
                        </div>
                    </div>
                    <div className="d-flex justify-content-end gap-4 mt-5">
                        <button onClick={() => setPostStep('JOB_LIST')} className="btn btn-link text-dark text-decoration-none fw-bold">CANCEL</button>
                        <button onClick={handlePostJob} className="btn btn-primary px-5 rounded-pill fw-bold shadow">POST JOB</button>
                    </div>
                </div>
            )}

            {/* 4. EVENT LIST */}
            {postStep === 'EVENT_LIST' && (
                <div>
                    
                    <button onClick={() => setPostStep('CATEGORIES')} className="btn btn-link text-dark text-decoration-none fw-bold p-0 mb-3">
                        <i className="fas fa-arrow-left me-2"></i> BACK
                    </button>

                    <h3 className="text-center brand-red-text fw-bold">BASED ON COLLEGE EVENT'S</h3>
                    <div className="d-flex justify-content-between align-items-center border-bottom pb-2 mt-4 mb-3">
                        <h5 className="fw-bold mb-0">UPCOMING EVENT'S</h5>
                        <button onClick={() => setPostStep('CREATE_EVENT')} className="btn btn-danger rounded-pill px-4 fw-bold shadow-sm">CREATE EVENT</button>
                    </div>

                    {[
                        { title: "Pongal Celebration", cat: "Cultural event", img: "https://via.placeholder.com/100" },
                        { title: "Festa 2k25", cat: "Festival", img: "https://via.placeholder.com/100" },
                        { title: "Diwali Night", cat: "Cultural event", img: "https://via.placeholder.com/100" },
                        { title: "Alumni Reunion", cat: "Festival", img: "https://via.placeholder.com/100" }
                    ].map((ev, idx) => (
                        <div key={idx} className="d-flex justify-content-between align-items-center py-4 border-bottom text-start">
                            <div style={{flex: 1}}>
                                <h6 className="brand-red-text fw-bold mb-1">{ev.title} <span className="text-muted small fw-normal ms-2">( {ev.cat} )</span></h6>
                                <p className="extra-small text-muted mb-3 pe-4">Join us for a vibrant celebration with traditional games, music, and a feast...</p>
                                <button className="btn btn-outline-secondary btn-sm rounded-pill px-4 shadow-sm">View Detail's</button>
                            </div>
                            <img src={ev.img} className="rounded-4 ms-4 shadow-sm" width="120" height="120" alt="event" />
                        </div>
                    ))}
                </div>
            )}

            {/* 5. CREATE EVENT */}
            {postStep === 'CREATE_EVENT' && (
                <div className="card border-0 shadow-lg rounded-4 p-5 mx-auto" style={{maxWidth: '900px'}}>
                  
                    <button onClick={() => setPostStep('EVENT_LIST')} className="btn btn-link text-dark text-decoration-none fw-bold p-0 mb-4 text-start">
                        <i className="fas fa-arrow-left me-2"></i> BACK
                    </button>

                    <h3 className="text-center brand-red-text fw-bold mb-5">Create Event's</h3>
                    <div className="row g-5 text-start">
                        <div className="col-md-7">
                            <label className="fw-bold small mb-2 text-muted">EVENT TITLE</label>
                            <input type="text" className="form-control bg-light border-0 py-2 rounded-3" placeholder="ENTER A EVENT TITLE" />
                            <label className="fw-bold small mt-4 mb-2 text-muted">EVENT DESCRIPTION</label>
                            <textarea className="form-control bg-light border-0 py-2 rounded-3" rows="4" placeholder="ENTER A EVENT DESCRIPTION"></textarea>
                            <label className="fw-bold small mt-4 mb-2 text-muted">REGISTRATION LINKS</label>
                            <input type="text" className="form-control bg-light border-0 py-2 rounded-3" placeholder="PASTE REGISTRATION LINKS" />
                            <div className="row mt-4">
                                <div className="col-6"><label className="fw-bold small text-muted">DATE & TIME</label><input type="text" className="form-control bg-light border-0 rounded-3" placeholder="DATE/TIME"/></div>
                                <div className="col-6"><label className="fw-bold small text-muted">VENUE</label><input type="text" className="form-control bg-light border-0 rounded-3" placeholder="LOCATION"/></div>
                            </div>
                        </div>
                        <div className="col-md-5">
                            <h6 className="fw-bold mb-3">preview</h6>
                            <div className="p-3 border rounded-4 bg-white shadow-sm text-center">
                                <div className="bg-light rounded-4 mb-3 d-flex align-items-center justify-content-center" style={{height: '200px'}}>Poster Preview</div>
                                <h6 className="fw-bold mb-1">Event Title</h6>
                                <button className="btn btn-outline-secondary btn-sm w-100 rounded-pill mt-2">VIEW DETAILS</button>
                            </div>
                        </div>
                    </div>
                    <div className="d-flex justify-content-end gap-4 mt-5">
                        <button onClick={() => setPostStep('EVENT_LIST')} className="btn btn-link text-dark text-decoration-none fw-bold">CANCEL</button>
                        <button onClick={() => setPostStep('EVENT_LIST')} className="btn btn-primary px-5 rounded-pill fw-bold shadow">POST EVENT</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Post;