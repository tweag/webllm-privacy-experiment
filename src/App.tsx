import { useChatModel } from './hooks/useChatModel';
import { ChatMessages } from './components/ChatMessages';
import { ChatInput } from './components/ChatInput';
import { ModelDownloadProgress } from './components/ModelDownloadProgress';
import { CHAT } from './config';
import './components/App.css';

function App() {
  const chatModel = useChatModel();

  return (
    <div className="app">
      {!chatModel.ready && (<ModelDownloadProgress text={chatModel.text}/>)}
      <ChatMessages messages={chatModel.messages} />
      <ChatInput 
        onSendMessage={chatModel.sendMessage} 
        isLoading={chatModel.isLoading} 
        maxTokens={CHAT.MAX_TOKENS}
        disabled={!chatModel.ready}
      />
    </div>
  );
}

export default App;
