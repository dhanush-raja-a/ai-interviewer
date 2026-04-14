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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const fetchSessions = async () => {
    try {
      const res = await fetch('/api/sessions/list');
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
            yearsExperience: parseInt(yearsExperience) || 0,
            jobDescription: jobDescription
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
      <div className="absolute inset-0 flex items-center justify-center bg-black">
        <div className="loader-ring"></div>
      </div>
    );
  }

  // Calculate stats
  const completedSessions = sessions.filter(s => s.status === 'completed');
  
  // Normalize scores to 0-10 range
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
    <div className="dashboard-premium" style={{ display: 'flex', minHeight: '100vh', background: '#000000', color: '#ededed' }}>
      {/* Background Orbs */}
      <div className="ambient-glow" style={{ top: '-300px', left: '-200px', background: 'radial-gradient(circle, rgba(99,102,241,0.1) 0%, transparent 70%)' }}></div>
      <div className="grid-bg"></div>

      {/* Sidebar */}
      <aside className="sidebar-premium" style={{ width: '280px', background: 'rgba(10,10,10,0.8)', borderRight: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', padding: '2rem 1.5rem', position: 'fixed', height: '100vh', left: 0, top: 0, zIndex: 50, backdropFilter: 'blur(20px)' }}>
        <div className="sidebar-logo" style={{ fontSize: '1.2rem', fontWeight: 800, color: 'white', marginBottom: '3rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div className="logo-icon-small">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a10 10 0 1 0 10 10H12V2z"/><path d="M12 12 2.1 7.1"/><path d="m12 12 9.9 4.9"/></svg>
            </div>
            Sarah AI
        </div>
        
        <nav className="sidebar-nav" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
          <Link href="/dashboard" className="nav-item-premium" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '12px', color: '#ffffff', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', textDecoration: 'none', fontWeight: 500, transition: 'all 0.3s' }}>
             <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg> <span>Overview</span>
          </Link>
          <button onClick={() => document.getElementById('recent-interviews')?.scrollIntoView({ behavior: 'smooth' })} className="nav-item-premium" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '12px', color: '#a1a1aa', background: 'none', border: 'none', textDecoration: 'none', fontWeight: 500, cursor: 'pointer', transition: 'all 0.3s' }}>
             <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10.4 12.6a2 2 0 1 1 3 3L8 21l-4 1 1-4Z"/><path d="M20 18v-2a4 4 0 0 0-4-4H4"/></svg> <span>Reports</span>
          </button>
        </nav>

        <div style={{ marginTop: 'auto', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', borderRadius: '12px', background: 'rgba(255,255,255,0.02)', marginBottom: '1rem' }}>
            <div className="avatar-mini">{session?.user?.name?.charAt(0) || 'U'}</div>
            <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'white', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{session?.user?.name}</span>
              <span style={{ fontSize: '0.7rem', color: '#a1a1aa', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{session?.user?.email}</span>
            </div>
          </div>
          <button onClick={() => signOut()} className="nav-item-subtle" style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '12px', color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', transition: 'all 0.3s' }}>
             <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg> <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content" style={{ flex: 1, marginLeft: '280px', padding: '3rem 4rem', position: 'relative', zIndex: 10 }}>
        {isSettingUp ? (
          <div className="animate-fade-in" style={{ animation: 'fade-in 0.5s ease-out' }}>
            <header style={{ marginBottom: '3rem' }}>
               <h1 style={{ fontSize: '3rem', fontWeight: '800', color: '#ffffff', letterSpacing: '-1px' }}>Initiate Protocol</h1>
               <p style={{ color: '#a1a1aa', fontSize: '1.1rem' }}>Configure neural parameters for your mock session.</p>
            </header>
            
            <form onSubmit={handleSetupSubmit} style={{ maxWidth: '700px', background: 'rgba(15,15,15,0.8)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '24px', padding: '40px', backdropFilter: 'blur(20px)', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}>
              <div className="form-group" style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '8px', color: '#e4e4e7', fontSize: '0.9rem', fontWeight: 500 }}>Upload Neural Context (Resume)</label>
                <div style={{ position: 'relative' }}>
                  <input type="file" accept=".pdf,.docx,.txt" onChange={(e) => setResumeFile(e.target.files?.[0] || null)} required style={{ width: '100%', padding: '14px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#a1a1aa' }} />
                </div>
              </div>
              <div className="form-group" style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '8px', color: '#e4e4e7', fontSize: '0.9rem', fontWeight: 500 }}>Target Role Vector</label>
                <input type="text" value={jobRole} onChange={(e) => setJobRole(e.target.value)} placeholder="e.g. Senior Software Engineer" required style={{ width: '100%', padding: '14px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: 'white', outline: 'none' }} />
              </div>
              <div className="form-group" style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '8px', color: '#e4e4e7', fontSize: '0.9rem', fontWeight: 500 }}>Job Description Context</label>
                <textarea value={jobDescription} onChange={(e) => setJobDescription(e.target.value)} placeholder="Paste the job description here..." required style={{ width: '100%', padding: '14px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: 'white', minHeight: '120px', resize: 'vertical', outline: 'none' }} />
              </div>
              <div className="form-group" style={{ marginBottom: '32px' }}>
                <label style={{ display: 'block', marginBottom: '8px', color: '#e4e4e7', fontSize: '0.9rem', fontWeight: 500 }}>Years of Experience</label>
                <input type="number" value={yearsExperience} onChange={(e) => setYearsExperience(e.target.value)} placeholder="0" min="0" style={{ width: '100%', padding: '14px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: 'white', outline: 'none' }} />
              </div>
              <div className="form-actions" style={{ display: 'flex', gap: '1rem' }}>
                <button type="button" onClick={() => setIsSettingUp(false)} style={{ flex: 1, padding: '14px', background: 'transparent', color: '#a1a1aa', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', cursor: 'pointer', transition: 'all 0.2s' }}>Abort</button>
                <button type="submit" disabled={isProcessing} className="btn-glow" style={{ flex: 2, justifyContent: 'center', width: '100%', padding: '14px', background: 'white', color: 'black', border: 'none', borderRadius: '12px' }}>
                  {isProcessing ? 'Compiling Matrices...' : 'Launch Simulation'}
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="animate-fade-in" style={{ animation: 'fade-in 0.5s ease-out' }}>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
              <div>
                <h1 style={{ fontSize: '2.5rem', fontWeight: '800', color: '#ffffff', letterSpacing: '-1px', marginBottom: '8px' }}>Dashboard Overview</h1>
                <p style={{ color: '#a1a1aa', fontSize: '1.05rem' }}>Monitor your interview performance vectors.</p>
              </div>
              <button onClick={() => setIsSettingUp(true)} className="btn-glow" style={{ padding: '12px 24px' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
                <span style={{ marginLeft: '8px' }}>New Interview</span>
              </button>
            </header>

            {/* Premium Stats Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', marginBottom: '2.5rem' }}>
              <div style={{ background: 'rgba(20,20,20,0.6)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '20px', padding: '24px', backdropFilter: 'blur(10px)' }}>
                <div style={{ color: '#a1a1aa', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>Total Sessions</div>
                <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'white' }}>{sessions.length}</div>
              </div>
              <div style={{ background: 'linear-gradient(145deg, rgba(20,20,20,0.8) 0%, rgba(30,30,40,0.6) 100%)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: '20px', padding: '24px', backdropFilter: 'blur(10px)' }}>
                <div style={{ color: '#818cf8', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>Average Score</div>
                <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'white' }}>{avgScore}<span style={{ fontSize: '1.2rem', color: '#6366f1' }}>/10</span></div>
              </div>
              <div style={{ background: 'rgba(20,20,20,0.6)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '20px', padding: '24px', backdropFilter: 'blur(10px)' }}>
                <div style={{ color: '#a1a1aa', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>Completed</div>
                <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'white' }}>{completedSessions.length}</div>
              </div>
            </div>

            {/* Analytics Section */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', marginBottom: '3rem' }}>
               <div style={{ background: 'rgba(15,15,15,0.8)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '24px', padding: '30px' }}>
                  <h3 style={{ fontWeight: '600', marginBottom: '2rem', color: '#e4e4e7', fontSize: '1.1rem' }}>Success Trajectory</h3>
                  <div style={{ height: '220px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', paddingBottom: '20px' }}>
                     {normalizedSessions.filter(s => s.status === 'completed').length > 0 ? (
                       normalizedSessions
                         .filter(s => s.status === 'completed')
                         .slice(-6)
                         .map((s, i) => (
                          <div key={s.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end', width: '12%' }}>
                            <div style={{ width: '100%', background: 'linear-gradient(to top, rgba(99,102,241,0.2), #6366f1)', borderRadius: '6px', position: 'relative', height: `${(s.display_score || 0) * 10}%`, transition: 'height 1s cubic-bezier(0.4, 0, 0.2, 1)', boxShadow: '0 0 20px rgba(99,102,241,0.2)' }}>
                               <span style={{ position: 'absolute', top: '-25px', left: '50%', transform: 'translateX(-50%)', fontSize: '0.8rem', fontWeight: 700, color: '#e4e4e7' }}>{s.display_score.toFixed(1)}</span>
                            </div>
                            <span style={{ marginTop: '10px', fontSize: '0.7rem', color: '#71717a', width: '100%', textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.job_role.split(' ')[0]}</span>
                          </div>
                        ))
                     ) : (
                       <p style={{ alignSelf: 'center', color: '#71717a' }}>Insufficient data. Complete an interview to render metrics.</p>
                     )}
                  </div>
               </div>

               <div style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(16,185,129,0.05))', border: '1px solid rgba(99,102,241,0.2)', borderRadius: '24px', padding: '30px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
                  <div style={{ width: '64px', height: '64px', background: 'rgba(99,102,241,0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px', color: '#818cf8' }}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                  </div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: '600', color: 'white', marginBottom: '10px' }}>Level Up Your Career</h3>
                  <p style={{ fontSize: '0.9rem', color: '#a1a1aa', marginBottom: '24px', lineHeight: 1.5 }}>Constant iteration is the key to engineering mastery. Run another simulation.</p>
                  <button onClick={() => setIsSettingUp(true)} className="btn-glow" style={{ width: '100%', justifyContent: 'center' }}>Launch Sarah</button>
               </div>
            </div>

            {/* Recent Table */}
            <section id="recent-interviews" style={{ background: 'rgba(15,15,15,0.6)', borderRadius: '24px', padding: '2rem', border: '1px solid rgba(255,255,255,0.05)', marginBottom: '2rem' }}>
               <h3 style={{ fontWeight: '600', marginBottom: '1.5rem', color: '#e4e4e7', fontSize: '1.1rem' }}>Interview Logs</h3>
               {sessions.length === 0 ? (
                 <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4rem 0', opacity: 0.6 }}>
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#71717a" strokeWidth="1"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
                    <p style={{ color: '#a1a1aa', marginTop: '1rem' }}>System memory is empty. Awaiting user input.</p>
                 </div>
               ) : (
                 <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                       <thead>
                          <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', textAlign: 'left' }}>
                             <th style={{ padding: '16px', color: '#a1a1aa', fontWeight: '500', fontSize: '0.8rem', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Target Role</th>
                             <th style={{ padding: '16px', color: '#a1a1aa', fontWeight: '500', fontSize: '0.8rem', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Timestamp</th>
                             <th style={{ padding: '16px', color: '#a1a1aa', fontWeight: '500', fontSize: '0.8rem', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Status</th>
                             <th style={{ padding: '16px', color: '#a1a1aa', fontWeight: '500', fontSize: '0.8rem', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Performance</th>
                             <th style={{ padding: '16px', textAlign: 'right' }}></th>
                          </tr>
                       </thead>
                       <tbody>
                          {sessions.map((s, idx) => (
                             <tr key={s.id} style={{ borderBottom: idx === sessions.length - 1 ? 'none' : '1px solid rgba(255,255,255,0.03)', transition: 'background 0.2s' }}>
                                <td style={{ padding: '20px 16px', fontWeight: '500', color: 'white' }}>{s.job_role}</td>
                                <td style={{ padding: '20px 16px', color: '#a1a1aa', fontSize: '0.9rem' }}>{new Date(s.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                                <td style={{ padding: '20px 16px' }}>
                                   <span style={{ 
                                      padding: '6px 12px', 
                                      borderRadius: '20px', 
                                      fontSize: '0.75rem', 
                                      fontWeight: '600',
                                      background: s.status === 'completed' ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)',
                                      color: s.status === 'completed' ? '#10b981' : '#f59e0b',
                                      border: `1px solid ${s.status === 'completed' ? 'rgba(16,185,129,0.2)' : 'rgba(245,158,11,0.2)'}`
                                   }}>
                                      {s.status.toUpperCase()}
                                   </span>
                                </td>
                                 <td style={{ padding: '20px 16px', fontWeight: '600', color: 'white' }}>
                                    {s.overall_score ? (
                                      <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: parseFloat(s.overall_score) > 7 ? '#10b981' : parseFloat(s.overall_score) > 5 ? '#f59e0b' : '#ef4444' }}></span>
                                        {s.display_score ? s.display_score.toFixed(1) : (parseFloat(s.overall_score) > 10 ? parseFloat(s.overall_score) / 10 : parseFloat(s.overall_score)).toFixed(1)}<span style={{ color: '#71717a', fontSize: '0.8rem', marginLeft: '2px' }}>/10</span>
                                      </span>
                                    ) : '-'}
                                 </td>
                                <td style={{ padding: '20px 16px', textAlign: 'right' }}>
                                   {s.status === 'completed' && (
                                     <Link href={`/results?sessionId=${s.id}`} style={{ color: '#a1a1aa', textDecoration: 'none', fontWeight: '500', fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px', transition: 'color 0.2s' }}>
                                        View Data <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
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
