import React, { useState, useEffect } from 'react';

interface Message {
  id: number;
  text: string;
  isUser: boolean;
}

type Theme = 'light' | 'dark' | 'system';

const MAX_TOKENS = 500;

// Approximate token count (4 chars per token is a rough estimate)
const estimateTokenCount = (text: string): number => {
  return Math.ceil(text.length / 4);
};

function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [theme, setTheme] = useState<Theme>('system');
  const [tokenCount, setTokenCount] = useState(0);

  useEffect(() => {
    document.documentElement.removeAttribute('data-theme');
    if (theme !== 'system') {
      document.documentElement.setAttribute('data-theme', theme);
    }
  }, [theme]);

  useEffect(() => {
    setTokenCount(estimateTokenCount(inputValue));
  }, [inputValue]);

  const generateAIResponse = async (userMessage: string) => {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OpenAI API key not found. Please add it to your .env file.');
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          ...messages.map(msg => ({
            role: msg.isUser ? 'user' : 'assistant',
            content: msg.text
          })),
          { role: 'user', content: userMessage }
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to generate AI response');
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || 'Sorry, I could not generate a response.';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || tokenCount > MAX_TOKENS) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now(),
      text: inputValue,
      isUser: true,
    };
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setTokenCount(0);
    setIsLoading(true);

    try {
      const aiResponse = await generateAIResponse(inputValue);
      const aiMessage: Message = {
        id: Date.now(),
        text: aiResponse,
        isUser: false,
      };
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error generating AI response:', error);
      const errorMessage: Message = {
        id: Date.now(),
        text: error instanceof Error ? error.message : 'An error occurred while generating the response.',
        isUser: false,
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    const newTokenCount = estimateTokenCount(newValue);
    if (newTokenCount <= MAX_TOKENS) {
      setInputValue(newValue);
      // Reset height and temporarily shrink to get the right scrollHeight
      e.target.style.height = 'auto';
      // Add 2px to prevent slight scrollbar flashing
      const newHeight = Math.min(e.target.scrollHeight + 2, 200);
      e.target.style.height = `${newHeight}px`;
    }
  };

  const toggleTheme = () => {
    setTheme(current => {
      if (current === 'system') return 'light';
      if (current === 'light') return 'dark';
      return 'system';
    });
  };

  return (
    <div className="app">
      <div className="chat-container">
        {messages.map((message) => (
          <div key={message.id} className={`message ${message.isUser ? 'user' : 'ai'}`}>
            <div className="message-content">
              {message.text}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="message ai">
            <div className="message-content">
              Thinking...
            </div>
          </div>
        )}
      </div>

      <div className="input-container">
        <div className="input-wrapper">
          <button onClick={toggleTheme} className="theme-toggle">
            {theme === 'system' ? (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 12V5.25" />
                </svg>
                System
              </>
            ) : theme === 'light' ? (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
                </svg>
                Light
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
                </svg>
                Dark
              </>
            )}
          </button>
          <form onSubmit={handleSubmit}>
            <div className="input-with-button">
              <div className="input-container-with-counter">
                <textarea
                  value={inputValue}
                  onChange={handleInputChange}
                  placeholder="Message ChatGPT..."
                  className="chat-input"
                  rows={1}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      if (inputValue.trim() && tokenCount <= MAX_TOKENS && !isLoading) {
                        handleSubmit(e as any);
                      }
                    }
                  }}
                />
                <div className={`token-counter ${tokenCount > MAX_TOKENS * 0.9 ? 'token-counter-warning' : ''}`}>
                  {tokenCount}/{MAX_TOKENS} tokens
                </div>
              </div>
              <button 
                type="submit" 
                className="submit-button"
                disabled={isLoading || !inputValue.trim() || tokenCount > MAX_TOKENS}
              >
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M7 11L12 6L17 11M12 18V7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default App;
