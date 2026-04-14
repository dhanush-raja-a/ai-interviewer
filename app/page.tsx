'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import '@/styles/globals.css';
import { useEffect, useState } from 'react';

export default function Home() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const loading = status === "loading";
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleStartInterview = () => {
    if (session) {
      router.push('/dashboard');
    } else {
      router.push('/login');
    }
  };

  if (loading) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-black">
        <div className="loader-ring"></div>
      </div>
    );
  }

  return (
    <main className="landing-premium">
      <div className="ambient-glow top-glow"></div>
      <div className="ambient-glow bottom-glow"></div>
      
      {/* Dynamic Grid Background */}
      <div className="grid-bg"></div>

      {/* Navbar */}
      <nav className={`navbar-premium ${scrolled ? 'scrolled' : ''}`}>
        <div className="nav-logo-premium">
          <div className="logo-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a10 10 0 1 0 10 10H12V2z"/><path d="M12 12 2.1 7.1"/><path d="m12 12 9.9 4.9"/></svg>
          </div>
          <span>Sarah AI</span>
        </div>
        <div className="nav-links-premium">
          {!session ? (
            <>
              <Link href="/login" className="nav-link-subtle">Log In</Link>
              <Link href="/register" className="btn-glow">Get Started</Link>
            </>
          ) : (
            <>
               <Link href="/dashboard" className="nav-link-subtle">Dashboard</Link>
               <button onClick={() => signOut()} className="nav-link-subtle">Sign Out</button>
               <div className="avatar-mini">{session.user?.name?.charAt(0) || 'U'}</div>
            </>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero-premium">
        <div className="badge-premium">
          <span className="badge-dot"></span>
          Revolutionizing Interview Prep
        </div>
        <h1 className="hero-title-premium">
          Master Your Interviews <br />
          <span className="text-gradient">With Artificial Intelligence.</span>
        </h1>
        <p className="hero-subtitle-premium">
          Stop leaving opportunities to chance. Sarah simulates hyper-realistic, 
          tailored interviews based on your specific resume and target role.
        </p>
        <div className="hero-actions-premium">
          <button onClick={handleStartInterview} className="btn-glow large">
            <span className="btn-text">{session ? 'Enter Dashboard' : 'Start Free Session'}</span>
            <svg className="arrow-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        </div>
        
        {/* Abstract App Preview */}
        <div className="hero-preview-wrapper">
          <div className="hero-preview">
            <div className="browser-header">
              <span className="dot close"></span>
              <span className="dot min"></span>
              <span className="dot max"></span>
            </div>
            <div className="preview-content">
              <div className="wave-animation"></div>
              <div className="preview-text">&quot;Tell me about a time you optimized a complex React application...&quot;</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-premium">
        <div className="section-header">
          <h2>Engineered for Excellence</h2>
          <p>Everything you need to land your dream offer</p>
        </div>
        
        <div className="bento-grid">
          <div className="bento-card col-span-2">
            <div className="bento-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
            </div>
            <h3>Context-Aware Questions</h3>
            <p>Advanced natural language processing immediately analyzes your resume and generates highly technical, targeted questions identical to what top tech companies ask.</p>
          </div>
          <div className="bento-card bg-gradient">
            <div className="bento-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
            </div>
            <h3>Real-Time Analytics</h3>
            <p>Immediate actionable feedback on delivery, technical accuracy, and structure.</p>
          </div>
          <div className="bento-card">
            <div className="bento-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/></svg>
            </div>
            <h3>Voice Native</h3>
            <p>Speak naturally with sub-500ms latency voice interaction.</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer-premium">
        <div className="footer-content">
          <div className="footer-brand">
            <div className="logo-icon-small">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a10 10 0 1 0 10 10H12V2z"/><path d="M12 12 2.1 7.1"/><path d="m12 12 9.9 4.9"/></svg>
            </div>
            Sarah AI
          </div>
          <div className="footer-links">
            <Link href="#">Privacy Policy</Link>
            <Link href="#">Terms of Service</Link>
            <Link href="#">Contact</Link>
          </div>
        </div>
        <div className="footer-bottom">
          <p>© 2026 Sarah AI. Architected for peak performance.</p>
        </div>
      </footer>
    </main>
  );
}