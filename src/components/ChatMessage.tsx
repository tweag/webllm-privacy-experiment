import React from 'react';
import { Message } from '../types/chat';

interface ChatMessageProps {
  message: Message;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => (
  <div className={`message ${message.isUser ? 'user' : 'ai'}`}>
    <div className="message-content">
      {message.text}
    </div>
  </div>
); 