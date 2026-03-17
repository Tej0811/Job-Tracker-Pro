import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus,
    Briefcase,
    XCircle,
    Eye,
    Linkedin,
    ExternalLink,
    TrendingUp,
    Search,
    CheckCircle2,
    Clock
} from 'lucide-react';
import './index.css';

const API_BASE = 'http://localhost:5005/api';

const App = () => {
    const [jobs, setJobs] = useState([]);
    const [linkedinUpdates, setLinkedinUpdates] = useState([]);
    const [viewCount, setViewCount] = useState(0);
    const [isAdding, setIsAdding] = useState(false);
    const [newJob, setNewJob] = useState({ company: '', role: '', status: 'applied' });

    useEffect(() => {
        fetchData();
        incrementViewCount();
    }, []);

    const fetchData = async () => {
        try {
            const respJobs = await axios.get(`${API_BASE}/jobs`);
            const respLinkedIn = await axios.get(`${API_BASE}/linkedin-updates`);
            const respViews = await axios.get(`${API_BASE}/views`);

            setJobs(respJobs.data);
            setLinkedinUpdates(respLinkedIn.data.length > 0 ? respLinkedIn.data : mockLinkedIn);
            setViewCount(respViews.data.totalViews);
        } catch (e) {
            console.error("Using mock data due to API unavailability", e);
            setJobs(mockJobs);
            setLinkedinUpdates(mockLinkedIn);
        }
    };

    const incrementViewCount = async () => {
        try { await axios.post(`${API_BASE}/views/increment`); } catch (e) { }
    };

    const handleAddJob = async () => {
        if (!newJob.company || !newJob.role) return;
        try {
            const resp = await axios.post(`${API_BASE}/jobs`, newJob);
            setJobs([...jobs, resp.data]);
            setIsAdding(false);
            setNewJob({ company: '', role: '', status: 'applied' });
        } catch (e) {
            // Local addition if backend fails
            const localJob = { ...newJob, id: Date.now(), date: new Date().toISOString() };
            setJobs([...jobs, localJob]);
            setIsAdding(false);
        }
    };

    const updateStatus = async (id, status) => {
        try {
            await axios.patch(`${API_BASE}/jobs/${id}/status`, { status });
            setJobs(jobs.map(j => j.id === id ? { ...j, status } : j));
        } catch (e) {
            setJobs(jobs.map(j => j.id === id ? { ...j, status } : j));
        }
    };

    const rejections = jobs.filter(j => j.status === 'rejected').length;
    const appliedToday = jobs.filter(j => new Date(j.date).toDateString() === new Date().toDateString()).length;

    return (
        <div className="App">
            <div className="Dashboard">
                <motion.header
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                >
                    <h1>JobTrack <span>Pro</span></h1>
                    <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>Personal application ecosystem & intelligence hub</p>
                </motion.header>

                {/* STATS SECTION */}
                <section className="stats-grid">
                    <StatCard label="Total Applied" value={jobs.length} icon={<Briefcase size={24} color="#6366f1" />} />
                    <StatCard label="Applied Today" value={appliedToday} icon={<TrendingUp size={24} color="#10b981" />} />
                    <StatCard label="Rejections" value={rejections} icon={<XCircle size={24} color="#ef4444" />} trend="Down 12%" />
                    <StatCard label="Site Views" value={viewCount} icon={<Eye size={24} color="#8b5cf6" />} />
                </section>

                <div className="main-content">
                    {/* TRACKING SECTION */}
                    <section>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h2 className="card-title"><Clock size={20} /> Application Tracking</h2>
                            <button className="btn-primary" onClick={() => setIsAdding(true)}>
                                <Plus size={18} style={{ verticalAlign: 'middle', marginRight: '4px' }} /> Add New
                            </button>
                        </div>

                        <AnimatePresence>
                            {isAdding && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="stat-card"
                                    style={{ marginBottom: '1.5rem', background: 'rgba(99, 102, 241, 0.1)' }}
                                >
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 100px', gap: '1rem' }}>
                                        <input
                                            type="text"
                                            placeholder="Company"
                                            className="form-input"
                                            value={newJob.company}
                                            onChange={e => setNewJob({ ...newJob, company: e.target.value })}
                                        />
                                        <input
                                            type="text"
                                            placeholder="Role (e.g. SDE-1)"
                                            className="form-input"
                                            value={newJob.role}
                                            onChange={e => setNewJob({ ...newJob, role: e.target.value })}
                                        />
                                        <button className="btn-primary" onClick={handleAddJob}>Save</button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="app-list">
                            {jobs.sort((a, b) => new Date(b.date) - new Date(a.date)).map((job, idx) => (
                                <motion.div
                                    key={job.id || idx}
                                    className="job-item"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                >
                                    <div>
                                        <strong style={{ display: 'block', fontSize: '1.1rem' }}>{job.company}</strong>
                                        <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{job.role}</span>
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                        <StatusBadge status={job.status} />
                                        {job.status === 'applied' && (
                                            <button
                                                onClick={() => updateStatus(job.id, 'rejected')}
                                                style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                                            >
                                                <XCircle size={18} />
                                            </button>
                                        )}
                                    </div>
                                </motion.div>
                            ))}
                            {jobs.length === 0 && <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No applications recorded yet.</p>}
                        </div>
                    </section>

                    {/* LINKEDIN FEED */}
                    <section className="stat-card">
                        <h2 className="card-title"><Linkedin size={20} color="#0a66c2" /> LinkedIn Real-time Feed</h2>
                        <div className="feed-list">
                            {linkedinUpdates.map((item, idx) => (
                                <div key={idx} style={{ padding: '0.75rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <strong>{item.title}</strong>
                                        <a href={item.link} target="_blank" rel="noreferrer"><ExternalLink size={14} color="var(--text-muted)" /></a>
                                    </div>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{item.company} • {item.location}</div>
                                    <div style={{ fontSize: '0.75rem', marginTop: '0.25rem', color: '#10b981' }}>{item.postedTime}</div>
                                </div>
                            ))}
                        </div>
                        <button style={{ width: '100%', marginTop: '1rem', background: 'none', border: '1px solid var(--card-border)', color: 'var(--text-muted)', padding: '0.5rem', borderRadius: '8px', cursor: 'pointer' }}>
                            Load More from LinkedIn
                        </button>
                    </section>
                </div>
            </div>

            {/* Footer / Meta Data */}
            <footer style={{ textAlign: 'center', marginTop: '4rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                <p>© 2026 JobTrack Pro Analytics. Developed with Node.js & React/Vite</p>
            </footer>

            <style>{`
        .form-input {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid var(--card-border);
          padding: 0.6rem;
          border-radius: 8px;
          color: white;
          width: 100%;
          outline: none;
        }
        .form-input:focus { border-color: var(--primary); }
        .badge {
          padding: 0.25rem 0.75rem;
          border-radius: 99px;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: capitalize;
        }
        .badge-applied { background: rgba(99, 102, 241, 0.2); color: #818cf8; }
        .badge-rejected { background: rgba(239, 68, 68, 0.2); color: #f87171; }
        .badge-interview { background: rgba(16, 185, 129, 0.2); color: #34d399; }
      `}</style>
        </div>
    );
};

const StatCard = ({ label, value, icon, trend }) => (
    <motion.div
        whileHover={{ y: -5 }}
        className="stat-card"
    >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
            <div className="stat-label">{label}</div>
            <div style={{ background: 'rgba(255,255,255,0.05)', padding: '0.5rem', borderRadius: '12px' }}>
                {icon}
            </div>
        </div>
        <div className="stat-value">{value}</div>
        {trend && (
            <div style={{ fontSize: '0.75rem', color: trend.includes('Up') ? '#10b981' : '#ef4444', display: 'flex', alignItems: 'center', gap: '4px' }}>
                {trend} from last week
            </div>
        )}
    </motion.div>
);

const StatusBadge = ({ status }) => (
    <span className={`badge badge-${status}`}>
        {status}
    </span>
);

const mockJobs = [
    { id: 1, company: 'Google', role: 'Software Engineer', status: 'applied', date: '2026-03-16T10:00:00Z' },
    { id: 2, company: 'Meta', role: 'Production Engineer', status: 'rejected', date: '2026-03-15T09:00:00Z' },
    { id: 3, company: 'Amazon', role: 'SDE-L4', status: 'applied', date: '2026-03-17T11:00:00Z' },
];

const mockLinkedIn = [
    { title: 'Frontend Developer', company: 'Netflix', location: 'Los Gatos, CA', postedTime: '2 hours ago', link: 'https://linkedin.com' },
    { title: 'Fullstack Engineer', company: 'Uber', location: 'San Francisco, CA', postedTime: '4 hours ago', link: 'https://linkedin.com' },
    { title: 'Backend Developer', company: 'Airbnb', location: 'Remote', postedTime: 'Just now', link: 'https://linkedin.com' },
    { title: 'Machine Learning Engineer', company: 'Tesla', location: 'Austin, TX', postedTime: '1 day ago', link: 'https://linkedin.com' },
];

export default App;
