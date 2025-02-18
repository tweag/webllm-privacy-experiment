import React, { useEffect, useRef } from 'react';
import { Message } from '../types/chat';
import './ChatMessages.css';

interface ChatMessagesProps {
  messages: Message[];
}

export const ChatMessages: React.FC<ChatMessagesProps> = ({ messages }) => {
  const bottomRef = useRef<HTMLDivElement>(null);
  const lastMessageRef = useRef<string>('');

  const scrollToBottom = () => {
    window.scrollTo({
      top: document.documentElement.scrollHeight,
      behavior: 'smooth'
    });
  };

  // Scroll on new messages
  useEffect(() => {
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.text !== lastMessageRef.current) {
        scrollToBottom();
        lastMessageRef.current = lastMessage.text;
      }
    }
  }, [messages]);

  // Scroll when content changes within the last message (streaming)
  useEffect(() => {
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (!lastMessage.isUser) {
        scrollToBottom();
      }
    }
  }, [messages[messages.length - 1]?.text]);

  return (
    <div className="chat-container">
      {messages.map((message) => (
        <div 
          key={message.id} 
          className={`message ${message.isUser ? 'user' : 'ai'}`}
        >
          <div className="message-content">
            {message.text}
          </div>
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  );
}; 