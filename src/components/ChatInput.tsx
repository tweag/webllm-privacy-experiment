import React, { useState, useEffect } from 'react';
import './ChatInput.css';

interface ChatInputProps {
  onSubmit: (message: string) => Promise<void>;
  isLoading: boolean;
  maxTokens: number;
  disabled?: boolean;
}

// Count tokens by splitting text into words
const countTokens = (text: string): number => {
  return text.trim().split(/\s+/).filter(token => token.length > 0).length;
};

export const ChatInput: React.FC<ChatInputProps> = ({ 
  onSubmit, 
  isLoading, 
  maxTokens,
  disabled = false
}) => {
  const [inputValue, setInputValue] = useState('');
  const [tokenCount, setTokenCount] = useState(0);

  useEffect(() => {
    setTokenCount(countTokens(inputValue));
  }, [inputValue]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || tokenCount > maxTokens) return;
    
    const prompt = inputValue;
    setInputValue('');
    setTokenCount(0);
    await onSubmit(prompt);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    const newTokenCount = countTokens(newValue);
    if (newTokenCount <= maxTokens) {
      setInputValue(newValue);
      e.target.style.height = 'auto';
      const newHeight = Math.min(e.target.scrollHeight + 2, 200);
      e.target.style.height = `${newHeight}px`;
    }
  };

  return (
    <div className="input-container">
      <div className="input-wrapper">
        <form onSubmit={handleSubmit}>
          <div className="input-with-button">
            <div className="input-container-with-counter">
              <textarea
                value={inputValue}
                onChange={handleInputChange}
                placeholder="Type your message..."
                className="chat-input"
                rows={1}
                disabled={disabled || isLoading}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    if (inputValue.trim() && tokenCount <= maxTokens && !isLoading && !disabled) {
                      handleSubmit(e as any);
                    }
                  }
                }}
              />
              <div className="input-controls">
                <div className={`token-counter ${tokenCount > maxTokens * 0.9 ? 'token-counter-warning' : ''}`}>
                  {tokenCount}/{maxTokens} words
                </div>
              </div>
            </div>
            <button 
              type="submit" 
              className="submit-button"
              disabled={isLoading || !inputValue.trim() || tokenCount > maxTokens || disabled}
            >
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M7 11L12 6L17 11M12 18V7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}; 