import React from 'react';
import './ModelDownloadProgress.css';

interface ModelDownloadProgressProps {
  progress: number;
  downloadedBytes?: number;
  totalBytes?: number;
  onDownload: () => void;
  isInitializing: boolean;
  isCheckingCache: boolean;
}

export const ModelDownloadProgress: React.FC<ModelDownloadProgressProps> = ({
  progress,
  downloadedBytes,
  totalBytes,
  onDownload,
  isInitializing,
  isCheckingCache
}) => {
  const percentage = Math.round(progress * 100);
  const formattedDownloaded = downloadedBytes ? formatBytes(downloadedBytes) : '';
  const formattedTotal = totalBytes ? formatBytes(totalBytes) : '';
  const showBytes = downloadedBytes && totalBytes;

  if (isCheckingCache) {
    return (
      <div className="model-download-overlay">
        <div className="model-download-content">
          <h3>Initializing Chat</h3>
          <p className="download-info">
            Please wait while we initialize the chat engine...
          </p>
        </div>
      </div>
    );
  }

  if (!isInitializing) {
    return (
      <div className="model-download-overlay">
        <div className="model-download-content">
          <h3>Welcome to the Chat App</h3>
          <p className="download-info">
            To get started, you'll need to download the Hermes model. 
            This is a one-time process, and the model will be cached for future use.
          </p>
          <button className="download-start-button" onClick={onDownload}>
            Download Model
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="model-download-overlay">
      <div className="model-download-content">
        <h3>Downloading Hermes Model</h3>
        <div className="progress-bar">
          <div 
            className="progress-fill"
            style={{ width: `${percentage}%` }}
          />
        </div>
        <div className="progress-text">
          <span>{percentage}%</span>
          {showBytes && (
            <span className="bytes-info">
              {formattedDownloaded} / {formattedTotal}
            </span>
          )}
        </div>
        <p className="download-info">
          This is a one-time download. The model will be cached for future use.
        </p>
      </div>
    </div>
  );
};

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
} 