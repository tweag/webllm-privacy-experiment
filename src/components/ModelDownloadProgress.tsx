import React from 'react';
import './ModelDownloadProgress.css';

interface ModelDownloadProgressProps {
  text: string | null;
}

export const ModelDownloadProgress: React.FC<ModelDownloadProgressProps> = ({
  text
}) => {
  return (
    <div className="model-download-overlay">
      <div className="model-download-content">
        <h3>Preparing Model</h3>
        <div className="progress-bar">
          <div className="progress-fill-infinite" />
        </div>
        {text && (
          <p className="download-info">
            {text}
          </p>
        )}
      </div>
    </div>
  );
}; 