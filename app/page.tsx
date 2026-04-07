'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import '@/styles/globals.css';

export default function Home() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const loading = status === "loading";

  const handleStartInterview = () => {
    if (session) {
      router.push('/dashboard');
    } else {
      router.push('/login');
    }
  };

  if (loading) {
    return <div className="loading" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontSize: '1.5rem' }}>Loading Sarah AI...</div>;
  }

  return (
    <main className="landing-container">
      {/* Navbar */}
      <nav className="navbar">
        <div className="nav-logo">Sarah AI</div>
        <div className="nav-links">
          {!session ? (
            <>
              <Link href="/login" className="btn-secondary" style={{ textDecoration: 'none' }}>Login</Link>
              <Link href="/register" className="btn-primary" style={{ textDecoration: 'none', margin: 0 }}>Sign Up</Link>
            </>
          ) : (
            <>
               <span style={{ alignSelf: 'center', fontWeight: '500', color: '#64748b' }}>Hi, {session.user?.name}</span>
               <Link href="/dashboard" className="btn-secondary" style={{ textDecoration: 'none' }}>Dashboard</Link>
               <button onClick={() => signOut()} className="btn-secondary">Logout</button>
            </>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="badge">✨ AI-Powered Career Growth</div>
        <h1 className="hero-title">Master Your Interviews with Sarah</h1>
        <p className="hero-subtitle">
          Don't leave your dream job to chance. Sarah uses advanced Generative AI to simulate hyper-realistic interviews tailored to your resume and target role.
        </p>
        <div className="hero-actions" style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem' }}>
          <button onClick={handleStartInterview} className="btn-primary" style={{ width: 'auto', padding: '18px 48px', fontSize: '1.2rem' }}>
            {session ? 'Go to Dashboard' : 'Start My Free Session'}
          </button>
          {!session && (
            <Link href="/register" className="btn-secondary" style={{ display: 'flex', alignItems: 'center', padding: '18px 48px', fontSize: '1.2rem', textDecoration: 'none' }}>
              Create Account
            </Link>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <h2 className="section-title">Why Practice with Sarah?</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">📄</div>
            <h3>Resume-Based Questions</h3>
            <p>Our AI analyzes your experience and skills to generate technical questions you're likely to face.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🎯</div>
            <h3>Real-time Feedback</h3>
            <p>Get instant scoring and detailed feedback on your answers, including what you did well and what to improve.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🎙️</div>
            <h3>Voice Interaction</h3>
            <p>Speak naturally. Sarah listens and responds with a human-like voice for a truly immersive experience.</p>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="how-it-works">
        <h2 className="section-title">Acing Your Interview is as Easy as 1-2-3</h2>
        <div className="steps-container">
          <div className="step-card">
            <div className="step-number">1</div>
            <h3>Upload & Setup</h3>
            <p>Upload your resume and paste the job description you're targeting.</p>
          </div>
          <div className="step-card">
            <div className="step-number">2</div>
            <h3>Mock Interview</h3>
            <p>Interact with Sarah in a live, voice-enabled simulated interview environment.</p>
          </div>
          <div className="step-card">
            <div className="step-number">3</div>
            <h3>Review Progress</h3>
            <p>Analyze your scores and feedback from your dashboard to perfect your pitch.</p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <h2>Ready to land that job?</h2>
        <p style={{ fontSize: '1.2rem', marginBottom: '30px', opacity: 0.9 }}>Join thousands of candidates who improved their confidence with Sarah AI.</p>
        <button onClick={handleStartInterview} className="btn-primary" style={{ width: 'auto', background: 'white', color: '#0f172a', padding: '18px 48px' }}>
          Get Started Now
        </button>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div style={{ color: '#64748b', fontSize: '0.9rem' }}>
          © 2026 Sarah AI Mock Interview Platform. Built with Google Gemini.
        </div>
        <div style={{ display: 'flex', gap: '2rem' }}>
          <Link href="#" style={{ color: '#64748b', textDecoration: 'none', fontSize: '0.9rem' }}>Privacy Policy</Link>
          <Link href="#" style={{ color: '#64748b', textDecoration: 'none', fontSize: '0.9rem' }}>Terms of Service</Link>
        </div>
      </footer>
    </main>
  );
}