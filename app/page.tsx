'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import '@/styles/globals.css';

export default function Home() {
  const router = useRouter();
  const [isSettingUp, setIsSettingUp] = useState(false);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [jobRole, setJobRole] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [yearsExperience, setYearsExperience] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resumeFile || !jobRole) return;

    setLoading(true);
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
        setLoading(false);
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
          setLoading(false);
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
    setLoading(false);
  };

  if (!isSettingUp) {
    return (
      <main className="container landing-container">
        <div className="hero-section">
          <div className="badge">✨ Next-Generation AI Mock Interviews</div>
          <h1 className="hero-title">Acing Your Next Interview Starts Here</h1>
          <p className="hero-subtitle">
            Upload your resume, specify your target role, and let Sarah, our intelligent AI interviewer, simulate a realistic technical and behavioral interview for you.
          </p>
          <div className="hero-actions">
            <button onClick={() => setIsSettingUp(true)} className="btn-primary hero-btn">
              Start Interview
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="container">
      <div className="hero">
        <h1>Interview Setup</h1>
        <p>Tell us about the role to customize your questions</p>
      </div>
      
      <form onSubmit={handleSubmit} className="form-card animate-fade-in">
        <div className="form-group">
          <label>Upload Resume (PDF, DOCX, TXT)</label>
          <input
            type="file"
            accept=".pdf,.docx,.txt"
            onChange={(e) => setResumeFile(e.target.files?.[0] || null)}
            required
            className="file-input"
          />
        </div>
        
        <div className="form-group">
          <label>Job Role</label>
          <input
            type="text"
            value={jobRole}
            onChange={(e) => setJobRole(e.target.value)}
            placeholder="e.g. Frontend Developer"
            required
            className="input"
          />
        </div>
        
        <div className="form-group">
          <label>Job Description</label>
          <textarea
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            placeholder="Paste the job description here..."
            rows={4}
            className="textarea"
          />
        </div>
        
        <div className="form-group">
          <label>Years of Experience</label>
          <input
            type="number"
            value={yearsExperience}
            onChange={(e) => setYearsExperience(e.target.value)}
            placeholder="0"
            min="0"
            className="input"
          />
        </div>
        
        <div className="form-actions">
          <button type="button" onClick={() => setIsSettingUp(false)} className="btn-secondary">
            Back
          </button>
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Processing...' : 'Continue'}
          </button>
        </div>
      </form>
    </main>
  );
}