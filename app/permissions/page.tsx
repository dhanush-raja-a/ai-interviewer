'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

export default function Permissions() {
  const router = useRouter();
  const [cameraGranted, setCameraGranted] = useState(false);
  const [micGranted, setMicGranted] = useState(false);
  const [screenGranted, setScreenGranted] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const sessionId = sessionStorage.getItem('sessionId');
    if (!sessionId) {
      router.push('/');
    }
  }, [router]);

  const requestCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      setCameraGranted(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (e) {
      console.error('Camera denied');
    }
  };

  const requestMic = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setMicGranted(true);
      stream.getTracks().forEach(t => t.stop());
    } catch (e) {
      console.error('Mic denied');
    }
  };

  const requestScreen = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      setScreenGranted(true);
      stream.getTracks().forEach(t => t.stop());
    } catch (e) {
      console.error('Screen denied');
    }
  };

  const startInterview = () => {
    if (cameraGranted && micGranted) {
      router.push('/interview');
    }
  };

  const skipScreen = () => {
    setScreenGranted(true);
  };

  return (
    <main className="container permissions-container">
      <div className="hero permissions-hero">
        <h1>Device Setup</h1>
        <p>Let's make sure everything is working before we start.</p>
      </div>
      
      <div className="permissions-split">
        <div className="permissions-left">
          <div className="video-preview-wrapper">
             <video ref={videoRef} autoPlay muted playsInline className="preview-feed" />
             {!cameraGranted && (
               <div className="preview-placeholder">
                  <span className="placeholder-icon">📷</span>
                  <p>Camera is currently off</p>
               </div>
             )}
          </div>
        </div>

        <div className="permissions-right">
          <div className="permissions-list">
            <div className={`permission-item ${cameraGranted ? 'granted' : ''}`}>
              <div className="icon">{cameraGranted ? '✓' : '📷'}</div>
              <div className="perm-info">
                <h3>Camera</h3>
                <p>{cameraGranted ? 'Camera access enabled' : 'Required for video feed'}</p>
              </div>
              {!cameraGranted && (
                <button onClick={requestCamera} className="btn-secondary btn-small">Allow</button>
              )}
            </div>
            
            <div className={`permission-item ${micGranted ? 'granted' : ''}`}>
              <div className="icon">{micGranted ? '✓' : '🎤'}</div>
              <div className="perm-info">
                <h3>Microphone</h3>
                <p>{micGranted ? 'Microphone enabled' : 'Required to capture voice'}</p>
              </div>
              {!micGranted && (
                <button onClick={requestMic} className="btn-secondary btn-small">Allow</button>
              )}
            </div>
            
            <div className={`permission-item ${screenGranted ? 'granted' : ''}`}>
              <div className="icon">{screenGranted ? '✓' : '🖥️'}</div>
              <div className="perm-info">
                <h3>Screen Share</h3>
                <p>{screenGranted ? 'Screen share enabled/skipped' : 'Optional - record your screen'}</p>
              </div>
              {!screenGranted && (
                <div className="optional-btns-row">
                  <button onClick={requestScreen} className="btn-secondary btn-small">Allow</button>
                  <button onClick={skipScreen} className="btn-text btn-small">Skip</button>
                </div>
              )}
            </div>
          </div>
          
          <button 
            onClick={startInterview} 
            disabled={!cameraGranted || !micGranted}
            className="btn-primary start-btn"
          >
            Start Interview →
          </button>
        </div>
      </div>
    </main>
  );
}