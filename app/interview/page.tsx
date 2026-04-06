'use client';

import { useState, useEffect, useRef } from 'react';
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

export default function Interview() {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [finished, setFinished] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const recognitionRef = useRef<any>(null);
  const transcriptRef = useRef('');

  // Setup User Camera Feed
  useEffect(() => {
    async function setupCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Camera access denied", err);
      }
    }
    setupCamera();

    // Cleanup camera when component unmounts
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
         const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
         tracks.forEach((track) => track.stop());
      }
    };
  }, []);

  // Pre-load voices for more human-like TTS
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
      };
    }
  }, []);

  useEffect(() => {
    const storedQuestions = sessionStorage.getItem('questions');
    if (!storedQuestions) {
      router.push('/');
      return;
    }
    setQuestions(JSON.parse(storedQuestions));
  }, [router]);

  useEffect(() => {
    if (questions.length > 0 && !finished) {
      const isFirst = currentIndex === 0;
      let textToSpeak = questions[currentIndex].question_text;
      if (isFirst) {
        textToSpeak = "Hi, I am Sarah, your AI mock interviewer. " + textToSpeak;
      }
      speakQuestion(textToSpeak);
    }
    
    // Prevent memory leaks on rapid unmounts
    return () => {
      window.speechSynthesis.cancel();
    };
  }, [currentIndex, questions, finished]);

  const speakQuestion = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    
    if (recognitionRef.current) {
      recognitionRef.current.abort();
      setIsListening(false);
    }

    setIsSpeaking(true);
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.1; // Slightly higher pitch for female voice

    const voices = window.speechSynthesis.getVoices();
    // Prioritize female and natural voices
    const preferredVoices = voices.filter(v => 
      v.name.includes("Samantha") ||
      v.name.includes("Zira") ||
      v.name.includes("Google UK English Female") ||
      (v.name.includes("Google") && v.name.includes("Female")) || 
      (v.lang === 'en-US' && v.name.includes("Natural"))
    );
    if (preferredVoices.length > 0) {
      utterance.voice = preferredVoices[0];
    } else {
      const enVoice = voices.find(v => v.lang.startsWith('en-'));
      if (enVoice) utterance.voice = enVoice;
    }
    
    utterance.onend = () => {
      setIsSpeaking(false);
      startListening(); 
    };
    
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  };

  const startListening = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Speech recognition not supported in this browser. Please use Chrome.');
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    
    transcriptRef.current = '';
    setTranscript('');
    
    recognition.onresult = (event: any) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        }
      }
      
      if (finalTranscript.trim()) {
         const newTranscript = transcriptRef.current + ' ' + finalTranscript;
         transcriptRef.current = newTranscript;
         setTranscript(newTranscript);
      }
    };

    recognition.onerror = (e: any) => {
      if (e.error === 'not-allowed') {
        console.error("Microphone permission denied.");
        setIsListening(false);
      }
    };

    recognition.onend = () => {
      // If we are supposed to be listening but the API stopped, restart it
      // unless we explicitly stopped it
      if (isListening && recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch (e) {
          // ignore
        }
      }
    };
    
    recognition.start();
    recognitionRef.current = recognition;
    setIsListening(true);
  };

  const handleManualSubmit = async () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
    const finalText = transcriptRef.current.trim();
    if (!finalText) {
      alert("Please say something before submitting or skip.");
      // restart listening if they want to try again
      startListening();
      return;
    }
    await submitAnswer(finalText);
  };

  const submitAnswer = async (text: string) => {
    const question = questions[currentIndex];
    const sessionId = sessionStorage.getItem('sessionId');

    try {
      const res = await fetch('/api/evaluate-answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          questionId: question.id,
          questionText: question.question_text,
          answerText: text
        }),
      });

      const data = await res.json();
      const answerWithText = { ...data, answerText: text };
      const updatedAnswers = [...answers, answerWithText];
      
      setAnswers(updatedAnswers);

      if (currentIndex < questions.length - 1) {
        setCurrentIndex(currentIndex + 1);
        setTranscript('');
        transcriptRef.current = '';
      } else {
        finishInterview(updatedAnswers);
      }
    } catch (error) {
      console.error('Error evaluating answer:', error);
    }
  };

  const finishInterview = async (finalAnswers: Answer[]) => {
    const sessionId = sessionStorage.getItem('sessionId');
    const totalScore = finalAnswers.reduce((sum, a) => sum + a.score, 0);
    const avgScore = (totalScore / questions.length) * 10;

    await fetch('/api/sessions', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, overallScore: avgScore }),
    });

    sessionStorage.setItem('answers', JSON.stringify(finalAnswers));
    sessionStorage.setItem('questions', JSON.stringify(questions));
    
    setFinished(true);
    router.push('/results');
  };

  const handleQuit = () => {
    if (confirm("Are you sure you want to quit the interview? Progress will be lost.")) {
      router.push('/');
    }
  };

  if (questions.length === 0) return <div className="container">Loading...</div>;

  const progress = ((currentIndex + 1) / questions.length) * 100;

  return (
    <main className="container interview-container">
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${progress}%` }}></div>
        <span>Question {currentIndex + 1} of {questions.length}</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
        <div className="interview-layout">
          <div className="ai-panel">
            <div className="ai-display" style={{ padding: '40px 0' }}>
              <div className={`ai-avatar-3d ${isSpeaking ? 'is-speaking' : ''}`}>
                <div className="sphere-core"></div>
                <div className="ring ring-x"></div>
                <div className="ring ring-y"></div>
                <div className="ring ring-z"></div>
                <div className="particles"></div>
              </div>
            </div>
            <div className="ai-status">
              <h3 className="ai-name">Sarah</h3>
              <p className="ai-state">
                {isSpeaking ? 'Speaking...' : isListening ? 'Listening your response...' : 'Processing...'}
              </p>
            </div>
          </div>

          <div className="user-panel">
            <div className={`video-wrapper ${isListening ? 'listening-active' : ''}`}>
              <video ref={videoRef} autoPlay muted playsInline className="video-feed-large" />
              {isListening && (
                <div className="listening-overlay">
                  <div className="audio-waves">
                    <span></span><span></span><span></span><span></span><span></span>
                  </div>
                  <p>Listening to you...</p>
                </div>
              )}
              <div className="user-name-tag">You (Candidate)</div>
            </div>
          </div>
        </div>

        <div className="question-display-panel" style={{ width: '100%', marginBottom: '40px' }}>
          <div className="q-header">
            <span className="q-label">Current Question</span>
            <span className="q-number">#{currentIndex + 1}</span>
          </div>
          <p className="q-text">{questions[currentIndex]?.question_text}</p>
          
          <div className="live-transcript">
            <div className="transcript-label">Live Transcript</div>
            <p className="transcript-text">{transcript || "Waiting for your response..."}</p>
            {isListening && <div className="transcript-cursor"></div>}
          </div>

          <div className="interview-actions" style={{ marginTop: '25px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button 
              onClick={handleQuit}
              className="btn-danger"
              style={{ background: 'transparent', color: '#ef4444', border: '1px solid #ef4444', padding: '12px 24px', borderRadius: '10px', cursor: 'pointer', fontWeight: 600 }}
            >
              Quit Interview
            </button>
            <button 
              onClick={handleManualSubmit}
              className="btn-primary"
              style={{ width: 'auto', margin: 0 }}
              disabled={isSpeaking || !isListening}
            >
              Finish Answering & Submit
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}