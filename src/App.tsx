import { useWebLlm } from './hooks/useWebLlm';
import { ChatMessages } from './components/ChatMessages';
import { ChatInput } from './components/ChatInput';
import { ModelDownloadProgress } from './components/ModelDownloadProgress';
import './components/App.css';

const MAX_TOKENS = 500;

function App() {
  const webLlm = useWebLlm();

  const showModelProgress = !webLlm.isDownloaded || webLlm.isCheckingCache;
  const inputDisabled = !webLlm.isDownloaded || webLlm.isCheckingCache;

  return (
    <div className="app">
      {showModelProgress && (
        <ModelDownloadProgress 
          progress={webLlm.initProgress}
          downloadedBytes={webLlm.downloadedBytes}
          totalBytes={webLlm.totalBytes}
          onDownload={webLlm.startDownload}
          isInitializing={webLlm.isInitializing}
          isCheckingCache={webLlm.isCheckingCache}
        />
      )}
      <ChatMessages messages={webLlm.messages} isLoading={webLlm.isLoading} />
      <ChatInput 
        onSubmit={webLlm.sendMessage} 
        isLoading={webLlm.isLoading} 
        maxTokens={MAX_TOKENS}
        disabled={inputDisabled}
      />
    </div>
  );
}

export default App;
