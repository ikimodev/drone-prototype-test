import React, { useState, useEffect, useRef } from 'react';
import './index.css';

function App() {
  const [logs, setLogs] = useState([]);
  const [systemTime, setSystemTime] = useState(new Date().toISOString());
  const [uploadStatus, setUploadStatus] = useState('');
  const fileInputRef = useRef(null);

  // Clock
  useEffect(() => {
    const timer = setInterval(() => {
      setSystemTime(new Date().toISOString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch real-time logs from Flask backend
  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const response = await fetch('http://localhost:5000/logs');
        if (response.ok) {
          const data = await response.json();
          if (data && data.length > 0) {
            // Update logs if we received new detections
            setLogs(prevLogs => {
              // Create new log entries with current time
              const newEntries = data.map(d => ({
                time: new Date().toLocaleTimeString(),
                shape: d.symbol,
                meaning: d.meaning,
                confidence: d.confidence,
                action: d.meaning === "MEDICAL_ASSISTANCE" ? "DEPLOY MEDICAL EXTRACT" : 
                        d.meaning === "EXTRACTION_REQUEST" ? "INITIATE EVAC PROTOCOL" : 
                        d.meaning === "FRIENDLY_POSITION" ? "LOG ALLY COORDINATES" : "LOITER & OBSERVE",
                alert: d.meaning === "MEDICAL_ASSISTANCE" || d.meaning === "EXTRACTION_REQUEST"
              }));

              // Only add if it's different from the very last one to prevent spam
              if (prevLogs.length > 0 && prevLogs[0].shape === newEntries[0].shape && prevLogs[0].meaning === newEntries[0].meaning) {
                return prevLogs;
              }

              const mergedLogs = [...newEntries, ...prevLogs];
              return mergedLogs.slice(0, 10);
            });
          }
        }
      } catch (error) {
        console.error("Failed to fetch logs from backend:", error);
      }
    };

    const logInterval = setInterval(fetchLogs, 1000);
    return () => clearInterval(logInterval);
  }, []);

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setUploadStatus('Uploading...');
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('http://localhost:5000/upload_video', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        setUploadStatus('Video active');
      } else {
        setUploadStatus('Upload failed');
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      setUploadStatus('Upload error');
    }
  };

  const switchToWebcam = async () => {
    setUploadStatus('Switching...');
    try {
      const response = await fetch('http://localhost:5000/use_webcam', {
        method: 'POST',
      });
      if (response.ok) {
        setUploadStatus('Webcam active');
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    } catch (error) {
      console.error('Error switching to webcam:', error);
      setUploadStatus('Switch error');
    }
  };

  const currentState = logs.length > 0 ? logs[0] : {
    shape: "NONE", 
    meaning: "SCANNING", 
    confidence: 0, 
    action: "MAINTAIN HOLDING PATTERN", 
    alert: false
  };

  const hasDetection = currentState.shape !== "NONE" && currentState.shape !== "UNKNOWN";

  return (
    <div className="dashboard-container">
      
      {/* HEADER */}
      <header className="panel header">
        <div className="title">NIGHTFALL // TACTICAL OVERWATCH</div>
        <div className="status-indicator" style={{ 
          borderColor: currentState.alert ? 'var(--neon-red)' : (hasDetection ? 'var(--neon-cyan)' : 'var(--neon-green)'),
          color: currentState.alert ? 'var(--neon-red)' : (hasDetection ? 'var(--neon-cyan)' : 'var(--neon-green)'),
          boxShadow: currentState.alert ? 'inset 0 0 10px rgba(255,0,60,0.2)' : ''
        }}>
          <div className="status-dot" style={{ 
            backgroundColor: currentState.alert ? 'var(--neon-red)' : (hasDetection ? 'var(--neon-cyan)' : 'var(--neon-green)'),
            boxShadow: currentState.alert ? '0 0 8px var(--neon-red)' : ''
          }}></div>
          {hasDetection ? 'SIGNAL ACQUIRED' : 'SCANNING FOR FLUORESCENCE'}
        </div>
      </header>

      {/* CAMERA FEED */}
      <div className="panel camera-feed">
        <div className="panel-title" style={{ position: 'absolute', top: '1rem', left: '1rem', zIndex: 10, border: 'none', backgroundColor: 'rgba(0,0,0,0.5)', padding: '0.5rem', display: 'flex', gap: '10px', alignItems: 'center' }}>
          <span>UAV_CAM_01 // LIVE_FEED</span>
          <div style={{ display: 'flex', gap: '5px' }}>
            <button 
              onClick={switchToWebcam}
              style={{ background: 'var(--neon-cyan)', color: '#000', border: 'none', padding: '2px 8px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold' }}
            >
              WEBCAM
            </button>
            <label style={{ background: 'var(--neon-green)', color: '#000', padding: '2px 8px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold' }}>
              UPLOAD VIDEO
              <input 
                type="file" 
                accept="video/*" 
                onChange={handleFileUpload} 
                style={{ display: 'none' }} 
                ref={fileInputRef}
              />
            </label>
            {uploadStatus && <span style={{ fontSize: '0.8rem', color: '#fff', marginLeft: '5px' }}>{uploadStatus}</span>}
          </div>
        </div>
        <div className="camera-image-container">
          <img src="http://localhost:5000/video_feed" alt="Live Drone Feed" className="camera-image" />
          <div className="crosshair"></div>
        </div>
      </div>

      {/* DETECTION PANEL */}
      <div className="panel detection-panel">
        <div className="panel-title">Signal Intelligence</div>
        <div className="log-list">
          {logs.length === 0 ? (
             <div className="log-item" style={{opacity: 0.5}}>Awaiting targets...</div>
          ) : logs.map((log, i) => (
            <div key={i} className={`log-item ${i === 0 ? 'active' : ''} ${log.alert ? 'alert' : ''}`}>
              <div className="log-time">{log.time}</div>
              <div><strong>SHAPE:</strong> {log.shape}</div>
              <div><strong>MATCH:</strong> {log.meaning}</div>
              <div><strong>CONF:</strong> {Math.round(log.confidence * 100)}%</div>
            </div>
          ))}
        </div>
      </div>

      {/* DECISION OUTPUT */}
      <div className="panel decision-output">
        <div className="panel-title" style={{alignSelf: 'flex-start'}}>System Recommendation</div>
        <div className={`decision-action ${currentState.alert ? 'alert' : (hasDetection ? '' : 'idle')}`}>
          {currentState.action}
        </div>
        <div className="decision-subtext">
          {hasDetection ? `BASED ON: ${currentState.meaning} SIGNAL` : 'AWAITING POSITIVE IDENTIFICATION'}
        </div>
      </div>

      {/* LOCATION SECTION */}
      <div className="panel location-section">
        <div className="panel-title">Telemetry</div>
        <div className="coord-display">
          LAT: 24.7136 N<br/>
          LON: 46.6753 E<br/>
          ALT: 450m AGL
        </div>
        <div className="map-placeholder">
          NO MAP TILE DATA
        </div>
      </div>

    </div>
  );
}

export default App;
