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
    const avgScore = totalScore / questions.length;

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

  if (questions.length === 0) return (
    <div className="absolute inset-0 flex items-center justify-center bg-black">
      <div className="loader-ring"></div>
    </div>
  );

  const progress = ((currentIndex + 1) / questions.length) * 100;

  return (
    <main style={{ width: '100vw', height: '100vh', background: '#050505', color: '#ededed', overflow: 'hidden', display: 'flex', flexDirection: 'column', position: 'relative', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      
      {/* Background Ambience */}
      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '80vw', height: '80vw', background: isListening ? 'radial-gradient(circle, rgba(16,185,129,0.05) 0%, transparent 60%)' : isSpeaking ? 'radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 60%)' : 'radial-gradient(circle, rgba(255,255,255,0.02) 0%, transparent 60%)', filter: 'blur(100px)', zIndex: 0, transition: 'all 1s ease' }}></div>
      <div className="grid-bg"></div>

      {/* Header */}
      <header style={{ position: 'relative', zIndex: 10, padding: '1.5rem 3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(5,5,5,0.8)', backdropFilter: 'blur(10px)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '28px', height: '28px', color: 'white' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a10 10 0 1 0 10 10H12V2z"/><path d="M12 12 2.1 7.1"/><path d="m12 12 9.9 4.9"/></svg>
          </div>
          <span style={{ fontWeight: 700 }}>Sarah AI Interface</span>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <span style={{ fontSize: '0.85rem', color: '#a1a1aa', fontWeight: 600 }}>Question {currentIndex + 1} / {questions.length}</span>
          <div style={{ width: '150px', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '10px', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${progress}%`, background: 'linear-gradient(90deg, #6366f1, #10b981)', transition: 'width 0.5s' }}></div>
          </div>
        </div>
      </header>

      {/* Split Screen Application Body */}
      <div style={{ flex: 1, display: 'flex', position: 'relative', zIndex: 10, padding: '2rem', gap: '2rem', height: 'calc(100vh - 80px)' }}>
        
        {/* LEFT COLUMN: AI & Questions & Transcript */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2rem', height: '100%' }}>
          
          {/* Question Card */}
          <div style={{ flex: '0 1 auto', maxHeight: '40%', overflowY: 'auto', background: 'rgba(15,15,15,0.8)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '24px', padding: '25px 30px', boxShadow: '0 20px 40px rgba(0,0,0,0.5)', backdropFilter: 'blur(10px)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: isSpeaking ? '#6366f1' : '#10b981', boxShadow: `0 0 10px ${isSpeaking ? '#6366f1' : '#10b981'}`, flexShrink: 0 }}></div>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '1px' }}>
                {isSpeaking ? 'Sarah Interrogating' : 'Awaiting Response'}
              </span>
            </div>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 500, lineHeight: 1.6, color: '#ffffff' }}>
              {questions[currentIndex]?.question_text}
            </h2>
          </div>

          {/* AI Visualizer & Transcript Row */}
          <div style={{ display: 'flex', gap: '2rem', flex: 1, minHeight: 0 }}>
            {/* AI Avatar Panel */}
            <div style={{ flex: '0 0 30%', background: 'rgba(15,15,15,0.6)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
              <div style={{ position: 'relative', width: '120px', height: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                {isSpeaking ? (
                  <div className="wave-animation" style={{ width: '100px', height: '2px', background: 'linear-gradient(90deg, transparent, #6366f1, transparent)', boxShadow: '0 0 30px #6366f1', animation: 'siri-wave 0.5s infinite ease-in-out alternate' }}></div>
                ) : (
                  <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: isListening ? '#10b981' : '#3f3f46', boxShadow: isListening ? '0 0 30px #10b981' : 'none', opacity: isListening ? 0.8 : 0.2, animation: isListening ? 'pulse-dot 2s infinite' : 'none' }}></div>
                )}
              </div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'white', marginBottom: '5px' }}>Sarah AI</h3>
              <p style={{ fontSize: '0.85rem', color: isListening ? '#10b981' : '#a1a1aa' }}>{isSpeaking ? 'Speaking...' : isListening ? 'Listening...' : 'Idle'}</p>
            </div>

            {/* Live Transcript Panel */}
            <div style={{ flex: 1, background: 'rgba(15,15,15,0.6)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '24px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <div style={{ padding: '15px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.2)' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '1px' }}>Live Transcription</span>
              </div>
              <div style={{ flex: 1, padding: '20px', overflowY: 'auto', position: 'relative' }}>
                {transcript ? (
                  <p style={{ fontSize: '1.1rem', color: '#e4e4e7', lineHeight: 1.6, fontStyle: 'italic' }}>
                    "{transcript}"<span className={isListening ? 'animate-pulse' : ''} style={{ display: 'inline-block', width: '8px', height: '18px', background: isListening ? '#10b981' : 'transparent', marginLeft: '4px', verticalAlign: 'middle' }}></span>
                  </p>
                ) : (
                  <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: '#52525b', fontStyle: 'italic', fontSize: '0.9rem' }}>
                    {isListening ? 'Speak now, transcribing...' : 'Awaiting input...'}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Action Dock */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(20,20,20,0.8)', padding: '20px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.08)' }}>
            <button onClick={handleQuit} style={{ padding: '12px 24px', background: 'transparent', color: '#ef4444', border: 'none', cursor: 'pointer', fontSize: '0.95rem', fontWeight: 600, transition: 'opacity 0.2s' }}>
              Abort Session
            </button>
            <button onClick={handleManualSubmit} disabled={isSpeaking || !isListening} className="btn-glow" style={{ padding: '14px 32px', background: isListening ? 'white' : 'rgba(255,255,255,0.1)', color: isListening ? 'black' : '#a1a1aa', border: 'none', borderRadius: '12px', fontSize: '1rem' }}>
               Submit Response
            </button>
          </div>

        </div>

        {/* RIGHT COLUMN: Candidate Camera */}
        <div style={{ flex: '0 0 45%', background: '#000', borderRadius: '24px', overflow: 'hidden', position: 'relative', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}>
          <video ref={videoRef} autoPlay muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} />
          
          {/* Camera UI Overlay */}
          <div style={{ position: 'absolute', top: '20px', right: '20px', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(10px)', padding: '6px 12px', borderRadius: '30px', display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444', animation: 'pulse-dot 2s infinite' }}></div>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'white', letterSpacing: '1px' }}>REC</span>
          </div>

          <div style={{ position: 'absolute', bottom: '20px', left: '20px', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(10px)', padding: '8px 16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
            <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'white' }}>Candidate Feed</span>
          </div>

          {/* Audio Visualizer Overlay on Video when listening */}
          {isListening && (
            <div style={{ position: 'absolute', bottom: '30px', right: '30px', display: 'flex', gap: '4px', height: '20px', alignItems: 'flex-end' }}>
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} style={{ width: '4px', background: '#10b981', borderRadius: '2px', animation: `siri-wave ${0.4 + i*0.1}s infinite alternate` }}></div>
              ))}
            </div>
          )}
        </div>

      </div>
    </main>
  );
}