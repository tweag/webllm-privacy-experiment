import React from 'react';
import { Message } from '../types/chat';
import { ChatMessage } from './ChatMessage';
import './ChatMessages.css';

interface ChatMessagesProps {
  messages: Message[];
  isLoading: boolean;
}

export const ChatMessages: React.FC<ChatMessagesProps> = ({ messages, isLoading }) => (
  <div className="chat-container">
    {messages.map((message) => (
      <ChatMessage key={message.id} message={message} />
    ))}
    {isLoading && (
      <div className="message ai">
        <div className="message-content">
          Thinking...
        </div>
      </div>
    )}
  </div>
); 