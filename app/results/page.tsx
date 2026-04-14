'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Question {
  id: number;
  question_number: number;
  question_text: string;
}

interface Answer {
  questionId: number;
  score: number;
  feedback: string;
  idealAnswer: string;
  answerText: string;
}

export default function Results() {
  const router = useRouter();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [overallScore, setOverallScore] = useState(0);

  useEffect(() => {
    const storedQuestions = sessionStorage.getItem('questions');
    const storedAnswers = sessionStorage.getItem('answers');
    
    if (!storedQuestions || !storedAnswers) {
      router.push('/dashboard');
      return;
    }

    setQuestions(JSON.parse(storedQuestions));
    setAnswers(JSON.parse(storedAnswers));
    
    const total = JSON.parse(storedAnswers).reduce((sum: number, a: Answer) => sum + a.score, 0);
    const avg = (total / JSON.parse(storedQuestions).length);
    setOverallScore(parseFloat(avg.toFixed(1)));
  }, [router]);

  const downloadReport = () => {
    let report = `AI Mock Interview Results\n`;
    report += `========================\n\n`;
    report += `Overall Score: ${overallScore}/10\n\n`;
    
    questions.forEach((q, i) => {
      const a = answers[i];
      report += `Question ${i + 1}: ${q.question_text}\n`;
      report += `Your Answer: ${a.answerText || 'N/A'}\n`;
      report += `Score: ${a.score}/10\n`;
      report += `Feedback: ${a.feedback}\n`;
      report += `Ideal Answer: ${a.idealAnswer}\n\n`;
    });

    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'interview-report.txt';
    a.click();
  };

  if (questions.length === 0) return (
    <div className="absolute inset-0 flex items-center justify-center bg-black">
      <div className="loader-ring"></div>
    </div>
  );

  const isExcellent = overallScore >= 8;
  const isGood = overallScore >= 6 && overallScore < 8;
  const scoreColor = isExcellent ? '#10b981' : isGood ? '#f59e0b' : '#ef4444';
  const scoreGlow = isExcellent ? 'rgba(16,185,129,0.2)' : isGood ? 'rgba(245,158,11,0.2)' : 'rgba(239,68,68,0.2)';

  return (
    <main style={{ minHeight: '100vh', background: '#000000', color: '#ededed', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', padding: '60px 2rem', position: 'relative' }}>
      
      {/* Ambience */}
      <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: '60vw', height: '600px', background: `radial-gradient(circle, ${scoreGlow} 0%, transparent 70%)`, filter: 'blur(80px)', pointerEvents: 'none', zIndex: 0 }}></div>
      <div className="grid-bg"></div>

      <div style={{ maxWidth: '1000px', margin: '0 auto', position: 'relative', zIndex: 10 }}>
        
        {/* Header Section */}
        <div style={{ textAlign: 'center', marginBottom: '60px' }}>
          <h1 style={{ fontSize: '3.5rem', fontWeight: 800, letterSpacing: '-1.5px', marginBottom: '40px', color: 'white' }}>Mission Accomplished</h1>
          
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '220px', height: '220px', borderRadius: '50%', background: 'rgba(15,15,15,0.8)', border: `2px solid ${scoreColor}`, boxShadow: `0 0 60px ${scoreGlow}, inset 0 0 40px ${scoreGlow}`, backdropFilter: 'blur(10px)', position: 'relative' }}>
            <div style={{ position: 'absolute', inset: -10, borderRadius: '50%', border: `1px dashed ${scoreColor}`, opacity: 0.3, animation: 'spin 20s linear infinite' }}></div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <span style={{ fontSize: '4.5rem', fontWeight: 800, color: 'white', lineHeight: 1 }}>{overallScore}</span>
              <span style={{ fontSize: '1.2rem', color: scoreColor, fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase', marginTop: '5px' }}>Out of 10</span>
            </div>
          </div>
        </div>

        {/* Action Buttons Top */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginBottom: '60px' }}>
          <button onClick={() => router.push('/dashboard')} style={{ padding: '14px 28px', background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', cursor: 'pointer', fontWeight: 600, transition: 'all 0.2s' }}>
            Return to Dashboard
          </button>
          <button onClick={downloadReport} className="btn-glow" style={{ padding: '14px 28px', background: 'white', color: 'black', border: 'none', borderRadius: '12px' }}>
            Export Intelligence Report
          </button>
        </div>

        {/* Results Bento Grid */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
          <h3 style={{ fontSize: '1.8rem', fontWeight: 700, color: 'white', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '15px' }}>Detailed Breakdown</h3>
          
          {questions.map((q, i) => {
            const a = answers[i];
            const qScoreColor = a.score >= 8 ? '#10b981' : a.score >= 5 ? '#f59e0b' : '#ef4444';
            
            return (
              <div key={q.id} style={{ background: 'rgba(15,15,15,0.8)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '24px', padding: '30px', backdropFilter: 'blur(20px)', transition: 'border-color 0.3s' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <span style={{ color: '#a1a1aa', fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase', fontSize: '0.85rem' }}>Question 0{i + 1}</span>
                  <div style={{ padding: '6px 16px', background: `rgba(${qScoreColor === '#10b981' ? '16,185,129' : qScoreColor === '#f59e0b' ? '245,158,11' : '239,68,68'}, 0.1)`, color: qScoreColor, borderRadius: '30px', fontWeight: 700, fontSize: '0.9rem', border: `1px solid ${qScoreColor}` }}>
                    {a.score} / 10
                  </div>
                </div>
                
                <h4 style={{ fontSize: '1.3rem', fontWeight: 600, color: 'white', marginBottom: '30px', lineHeight: 1.5 }}>{q.question_text}</h4>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
                  <div style={{ background: 'rgba(20,20,20,0.5)', padding: '20px', borderRadius: '16px', borderLeft: '3px solid #3b82f6' }}>
                    <h5 style={{ fontSize: '0.8rem', fontWeight: 600, color: '#3b82f6', textTransform: 'uppercase', marginBottom: '10px' }}>Your Response</h5>
                    <p style={{ color: '#e4e4e7', fontSize: '1rem', lineHeight: 1.6 }}>{a.answerText || 'No verbal response detected.'}</p>
                  </div>
                  
                  <div style={{ background: 'rgba(20,20,20,0.5)', padding: '20px', borderRadius: '16px', borderLeft: `3px solid ${qScoreColor}` }}>
                    <h5 style={{ fontSize: '0.8rem', fontWeight: 600, color: qScoreColor, textTransform: 'uppercase', marginBottom: '10px' }}>AI Feedback</h5>
                    <p style={{ color: '#e4e4e7', fontSize: '1rem', lineHeight: 1.6 }}>{a.feedback}</p>
                  </div>

                  <div style={{ background: 'rgba(16,185,129,0.05)', padding: '20px', borderRadius: '16px', borderLeft: '3px solid #10b981' }}>
                    <h5 style={{ fontSize: '0.8rem', fontWeight: 600, color: '#10b981', textTransform: 'uppercase', marginBottom: '10px' }}>Ideal Vector</h5>
                    <p style={{ color: '#e4e4e7', fontSize: '1rem', lineHeight: 1.6 }}>{a.idealAnswer}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}