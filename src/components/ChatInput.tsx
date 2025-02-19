import React, { useState, useRef, useCallback, useEffect } from 'react';
import './ChatInput.css';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
  isLoading?: boolean;
  maxTokens?: number;
}

export const ChatInput: React.FC<ChatInputProps> = ({ 
  onSendMessage, 
  disabled,
  isLoading = false,
  maxTokens = 500
}) => {
  const [message, setMessage] = useState('');
  const [tokenCount, setTokenCount] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const words = message.trim().split(/\s+/).filter(word => word.length > 0);
    setTokenCount(words.length);
  }, [message]);

  // Focus the input when loading state changes from true to false
  useEffect(() => {
    if (!isLoading && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isLoading]);

  const handleSendMessage = useCallback(() => {
    if (message.trim() && !disabled && !isLoading && tokenCount <= maxTokens) {
      onSendMessage(message.trim());
      setMessage('');
    }
  }, [message, disabled, isLoading, tokenCount, maxTokens, onSendMessage]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Focus input on component mount
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

  return (
    <div className="chat-input-container">
      <div className="chat-input-wrapper">
        <div className="input-container-with-counter">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            disabled={disabled || isLoading}
            rows={1}
          />
          <div className={`token-counter ${tokenCount > maxTokens * 0.9 ? 'token-counter-warning' : ''}`}>
            {tokenCount}/{maxTokens} words
          </div>
        </div>
        <button 
          onClick={handleSendMessage}
          disabled={!message.trim() || disabled || isLoading || tokenCount > maxTokens}
          className={isLoading ? 'loading' : ''}
        >
          {isLoading ? '•' : 'Send'}
        </button>
      </div>
    </div>
  );
}; 