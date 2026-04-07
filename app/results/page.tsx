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
      router.push('/');
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

  if (questions.length === 0) return <div className="container">Loading...</div>;

  return (
    <main className="container">
      <div className="results-header">
        <h1>Interview Complete!</h1>
        <div className="score-circle">
          <span className="score">{overallScore}</span>
          <span className="label">/10</span>
        </div>
      </div>

      <div className="results-grid">
        {questions.map((q, i) => {
          const a = answers[i];
          return (
            <div key={q.id} className="result-card">
              <div className="result-header">
                <h3>Question {i + 1}</h3>
                <span className={`score-badge ${a.score >= 7 ? 'good' : a.score >= 4 ? 'mid' : 'low'}`}>
                  {a.score}/10
                </span>
              </div>
              <p className="question-text">{q.question_text}</p>
              <div className="answer-section">
                <p><strong>Your Answer:</strong> {a.answerText || 'No answer recorded'}</p>
                <p><strong>Feedback:</strong> {a.feedback}</p>
                <p className="ideal"><strong>Ideal Answer:</strong> {a.idealAnswer}</p>
              </div>
            </div>
          );
        })}
      </div>

      <button onClick={downloadReport} className="btn-primary">
        Download Report
      </button>

      <button onClick={() => { sessionStorage.clear(); router.push('/'); }} className="btn-secondary">
        Start New Interview
      </button>
    </main>
  );
}