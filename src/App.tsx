import { useChatModel } from './hooks/useChatModel';
import { ChatMessages } from './components/ChatMessages';
import { ChatInput } from './components/ChatInput';
import { ModelDownloadProgress } from './components/ModelDownloadProgress';
import './components/App.css';

const MAX_TOKENS = 500;

function App() {
  const chatModel = useChatModel();

  return (
    <div className="app">
      {!chatModel.ready && (<ModelDownloadProgress text={chatModel.text}/>)}
      <ChatMessages messages={chatModel.messages} />
      <ChatInput 
        onSubmit={chatModel.sendMessage} 
        isLoading={chatModel.isLoading} 
        maxTokens={MAX_TOKENS}
        disabled={!chatModel.ready}
      />
    </div>
  );
}

export default App;
