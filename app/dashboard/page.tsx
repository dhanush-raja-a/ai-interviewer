'use client';

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import "@/styles/globals.css";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSettingUp, setIsSettingUp] = useState(false);
  
  // Setup form states
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [jobRole, setJobRole] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [yearsExperience, setYearsExperience] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated") {
      fetchSessions();
    }
  }, [status]);

  const fetchSessions = async () => {
    try {
      const res = await fetch('/api/sessions/list'); // I need to create this endpoint or handle it
      if (res.ok) {
        const data = await res.json();
        setSessions(data.sessions);
      }
    } catch (error) {
      console.error("Failed to fetch sessions", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSetupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resumeFile || !jobRole) return;

    setIsProcessing(true);
    try {
      const formData = new FormData();
      formData.append('resume', resumeFile);
      formData.append('jobRole', jobRole);
      formData.append('jobDescription', jobDescription);
      formData.append('yearsExperience', yearsExperience);

      const res = await fetch('/api/parse-resume', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        alert(err.error || 'Failed to parse resume');
        setIsProcessing(false);
        return;
      }

      const data = await res.json();
      
      if (data.sessionId) {
        const questionsRes = await fetch('/api/generate-questions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId: data.sessionId,
            resumeText: data.resumeText,
            jobRole,
            yearsExperience: parseInt(yearsExperience) || 0
          }),
        });

        if (!questionsRes.ok) {
          const err = await questionsRes.json();
          alert(err.error || 'Failed to generate questions');
          setIsProcessing(false);
          return;
        }

        const questionsData = await questionsRes.json();
        
        sessionStorage.setItem('sessionId', data.sessionId);
        sessionStorage.setItem('candidateName', data.candidateName);
        sessionStorage.setItem('questions', JSON.stringify(questionsData.questions));
        
        router.push('/permissions');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('An error occurred. Please try again.');
    }
    setIsProcessing(false);
  };

  if (status === "loading" || loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f1f5f9' }}>
        <div style={{ fontSize: '1.2rem', color: '#64748b' }}>Preparing your dashboard...</div>
      </div>
    );
  }

  // Calculate stats
  const completedSessions = sessions.filter(s => s.status === 'completed');
  
  // Normalize scores to 0-10 range if they were previously stored as 0-100
  const normalizedSessions = sessions.map(s => {
    let score = parseFloat(s.overall_score || 0);
    if (score > 10) score = score / 10;
    return { ...s, display_score: score };
  });

  const avgScoreNum = normalizedSessions.length > 0 
    ? (normalizedSessions.reduce((acc, s) => acc + (s.display_score || 0), 0) / normalizedSessions.length)
    : 0;
  const avgScore = avgScoreNum.toFixed(1);

  return (
    <div className="dashboard-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-logo">Sarah AI</div>
        
        <nav className="sidebar-nav">
          <Link href="/dashboard" className="nav-item active">
             <i style={{ fontStyle: 'normal' }}>🏠</i> <span>Overview</span>
          </Link>
          <button onClick={() => document.getElementById('recent-interviews')?.scrollIntoView({ behavior: 'smooth' })} className="nav-item" style={{ background: 'none', border: 'none', width: '100%', cursor: 'pointer', textAlign: 'left' }}>
             <i style={{ fontStyle: 'normal' }}>📊</i> <span>Reports</span>
          </button>
          <Link href="/dashboard" className="nav-item">
             <i style={{ fontStyle: 'normal' }}>👤</i> <span>Profile</span>
          </Link>
          <Link href="/dashboard" className="nav-item">
             <i style={{ fontStyle: 'normal' }}>⚙️</i> <span>Settings</span>
          </Link>
        </nav>

        <div style={{ marginTop: 'auto', borderTop: '1px solid #e2e8f0', paddingTop: '1.5rem' }}>
          <button onClick={() => signOut()} className="nav-item" style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer' }}>
             <i style={{ fontStyle: 'normal' }}>🚪</i> <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        {isSettingUp ? (
          <div className="animate-fade-in">
            <header style={{ marginBottom: '2rem' }}>
               <h1 style={{ fontSize: '2.5rem', fontWeight: '800', color: '#0f172a' }}>Interview Setup</h1>
               <p style={{ color: '#64748b' }}>Configure your session to begin</p>
            </header>
            
            <form onSubmit={handleSetupSubmit} className="form-card" style={{ maxWidth: '700px', background: 'white' }}>
              <div className="form-group">
                <label>Upload Resume</label>
                <input type="file" accept=".pdf,.docx,.txt" onChange={(e) => setResumeFile(e.target.files?.[0] || null)} required className="file-input" />
              </div>
              <div className="form-group">
                <label>Job Role</label>
                <input type="text" value={jobRole} onChange={(e) => setJobRole(e.target.value)} placeholder="e.g. Senior Software Engineer" required className="input" />
              </div>
              <div className="form-group">
                <label>Years of Experience</label>
                <input type="number" value={yearsExperience} onChange={(e) => setYearsExperience(e.target.value)} placeholder="0" min="0" className="input" />
              </div>
              <div className="form-actions" style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                <button type="button" onClick={() => setIsSettingUp(false)} className="btn-secondary" style={{ flex: 1 }}>Cancel</button>
                <button type="submit" disabled={isProcessing} className="btn-primary" style={{ flex: 2 }}>{isProcessing ? 'Processing...' : 'Launch Interview'}</button>
              </div>
            </form>
          </div>
        ) : (
          <div className="animate-fade-in">
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '3rem' }}>
              <div>
                <h1 style={{ fontSize: '2rem', fontWeight: '800', color: '#0f172a' }}>Welcome back, {session?.user?.name}</h1>
                <p style={{ color: '#64748b' }}>Here&apos;s what&apos;s happening with your interview progress.</p>
              </div>
              <button onClick={() => setIsSettingUp(true)} className="btn-primary" style={{ width: 'auto', padding: '12px 24px', boxShadow: '0 4px 15px rgba(99, 102, 241, 0.4)' }}>
                + Start New Interview
              </button>
            </header>

            {/* Stats Grid */}
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-title">Total Interviews</div>
                <div className="stat-value">{sessions.length}</div>
              </div>
              <div className="stat-card">
                <div className="stat-title">Avg. Score</div>
                <div className="stat-value">{avgScore}<span style={{ fontSize: '1rem', color: '#94a3b8' }}>/10</span></div>
              </div>
              <div className="stat-card">
                <div className="stat-title">Completed</div>
                <div className="stat-value">{completedSessions.length}</div>
              </div>
            </div>

            {/* Analytics Section */}
            <div className="analytics-container">
               <div className="chart-card">
                  <h3 style={{ fontWeight: '700', marginBottom: '1rem' }}>Score Performance</h3>
                  <div className="chart-placeholder">
                     {normalizedSessions.filter(s => s.status === 'completed').length > 0 ? (
                       normalizedSessions
                         .filter(s => s.status === 'completed')
                         .slice(-5)
                         .map((s, i) => (
                          <div key={s.id} className="bar-container">
                            <div className="bar" style={{ height: `${(s.display_score || 0) * 10}%` }} data-label={s.job_role.substring(0, 8) + '...'}>
                               <span className="bar-value">{s.display_score}</span>
                            </div>
                          </div>
                        ))
                     ) : (
                       <p style={{ alignSelf: 'center', color: '#94a3b8' }}>Complete interviews to see score trends</p>
                     )}
                  </div>
               </div>

               <div className="stat-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', textAlign: 'center', background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))', color: 'white' }}>
                  <div style={{ fontSize: '3rem', marginBottom: '10px' }}>🚀</div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: '700' }}>Ready for a challenge?</h3>
                  <p style={{ fontSize: '0.9rem', marginBottom: '1.5rem', opacity: 0.9 }}>Practice makes perfect. Start a new session to improve your score!</p>
                  <button onClick={() => setIsSettingUp(true)} className="btn-primary" style={{ background: 'white', color: 'var(--accent-primary)', width: 'auto', alignSelf: 'center' }}>Launch Sarah</button>
               </div>
            </div>

            {/* Recent Table */}
            <section id="recent-interviews" style={{ background: 'white', borderRadius: '24px', padding: '2rem', border: '1px solid #e2e8f0', marginBottom: '2rem' }}>
               <h3 style={{ fontWeight: '700', marginBottom: '1.5rem' }}>Recent Interviews</h3>
               {sessions.length === 0 ? (
                 <p style={{ color: '#64748b', textAlign: 'center', padding: '2rem' }}>No records found.</p>
               ) : (
                 <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                       <thead>
                          <tr style={{ borderBottom: '1px solid #f1f5f9', textAlign: 'left' }}>
                             <th style={{ padding: '12px', color: '#64748b', fontWeight: '600', fontSize: '0.85rem' }}>JOB ROLE</th>
                             <th style={{ padding: '12px', color: '#64748b', fontWeight: '600', fontSize: '0.85rem' }}>DATE</th>
                             <th style={{ padding: '12px', color: '#64748b', fontWeight: '600', fontSize: '0.85rem' }}>STATUS</th>
                             <th style={{ padding: '12px', color: '#64748b', fontWeight: '600', fontSize: '0.85rem' }}>SCORE</th>
                             <th style={{ padding: '12px', textAlign: 'right' }}></th>
                          </tr>
                       </thead>
                       <tbody>
                          {sessions.map(s => (
                             <tr key={s.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                                <td style={{ padding: '16px 12px', fontWeight: '600' }}>{s.job_role}</td>
                                <td style={{ padding: '16px 12px', color: '#64748b', fontSize: '0.9rem' }}>{new Date(s.created_at).toLocaleDateString()}</td>
                                <td style={{ padding: '16px 12px' }}>
                                   <span style={{ 
                                      padding: '4px 10px', 
                                      borderRadius: '12px', 
                                      fontSize: '0.75rem', 
                                      fontWeight: '700',
                                      background: s.status === 'completed' ? '#dcfce7' : '#fef9c3',
                                      color: s.status === 'completed' ? '#166534' : '#854d0e'
                                   }}>
                                      {s.status.toUpperCase()}
                                   </span>
                                </td>
                                 <td style={{ padding: '16px 12px', fontWeight: '700', color: 'var(--accent-primary)' }}>
                                    {s.overall_score ? `${(parseFloat(s.overall_score) > 10 ? parseFloat(s.overall_score) / 10 : parseFloat(s.overall_score)).toFixed(1)}/10` : '-'}
                                 </td>
                                <td style={{ padding: '16px 12px', textAlign: 'right' }}>
                                   {s.status === 'completed' && (
                                     <Link href={`/results?sessionId=${s.id}`} style={{ color: 'var(--accent-primary)', textDecoration: 'none', fontWeight: '700', fontSize: '0.9rem' }}>
                                        View →
                                     </Link>
                                   )}
                                </td>
                             </tr>
                          ))}
                       </tbody>
                    </table>
                 </div>
               )}
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
