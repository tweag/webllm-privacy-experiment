import React, { useState, useEffect } from 'react';
import './ModelDownloadProgress.css';

interface ModelDownloadProgressProps {
  text: string | null;
}

export const ModelDownloadProgress: React.FC<ModelDownloadProgressProps> = ({
  text
}) => {
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedTime(prev => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="model-download-overlay">
      <div className="model-download-content">
        <h3>Preparing Model</h3>
        <div className="progress-bar">
          <div className="progress-fill-infinite" />
        </div>
        <div className="timer">{elapsedTime}s</div>
        {text && (
          <p className="download-info">
            {text}
          </p>
        )}
      </div>
    </div>
  );
}; 