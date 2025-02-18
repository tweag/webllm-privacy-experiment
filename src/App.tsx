import { useWebLlm } from './hooks/useWebLlm';
import { ChatMessages } from './components/ChatMessages';
import { ChatInput } from './components/ChatInput';
import { ModelDownloadProgress } from './components/ModelDownloadProgress';
import './components/App.css';

const MAX_TOKENS = 500;

function App() {
  const webLlm = useWebLlm();

  return (
    <div className="app">
      {!webLlm.ready && (<ModelDownloadProgress text={webLlm.text}/>)}
      <ChatMessages messages={webLlm.messages} />
      <ChatInput 
        onSubmit={webLlm.sendMessage} 
        isLoading={webLlm.isLoading} 
        maxTokens={MAX_TOKENS}
        disabled={false}
      />
    </div>
  );
}

export default App;
