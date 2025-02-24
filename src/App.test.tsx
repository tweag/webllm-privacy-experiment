import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import App from './App';
import { useChatModel } from './hooks/useChatModel';
import { Message } from './models/message';

// Mock the useChatModel hook
vi.mock('./hooks/useChatModel', () => ({
  useChatModel: vi.fn()
}));

describe('App', () => {
  it('renders loading state correctly', () => {
    vi.mocked(useChatModel).mockReturnValue({
      ready: false,
      text: 'Downloading model...',
      messages: [],
      isLoading: false,
      sendMessage: vi.fn()
    });

    render(<App />);

    // ModelDownloadProgress should be visible
    expect(screen.getByText('Preparing Model')).toBeInTheDocument();
    expect(screen.getByText('Downloading model...')).toBeInTheDocument();
    
    // ChatInput should be disabled
    const input = screen.getByPlaceholderText('Type a message...');
    expect(input).toBeDisabled();
  });

  it('renders ready state correctly', () => {
    const messages: Message[] = [
      { id: '1', text: 'Hello', isUser: true, source: 'User' },
      { id: '2', text: 'Hi there!', isUser: false, source: 'WebLLM' }
    ];

    vi.mocked(useChatModel).mockReturnValue({
      ready: true,
      text: null,
      messages,
      isLoading: false,
      sendMessage: vi.fn()
    });

    render(<App />);

    // ModelDownloadProgress should not be visible
    expect(screen.queryByText('Preparing Model')).not.toBeInTheDocument();
    
    // Messages should be visible
    expect(screen.getByText('Hello')).toBeInTheDocument();
    expect(screen.getByText('Hi there!')).toBeInTheDocument();
    
    // ChatInput should be enabled
    const input = screen.getByPlaceholderText('Type a message...');
    expect(input).not.toBeDisabled();
  });

  it('handles loading state during message sending', () => {
    vi.mocked(useChatModel).mockReturnValue({
      ready: true,
      text: null,
      messages: [],
      isLoading: true,
      sendMessage: vi.fn()
    });

    render(<App />);

    // ChatInput should show loading state
    const button = screen.getByRole('button');
    expect(button).toHaveClass('loading');
    expect(button).toHaveTextContent('•');
  });

  it('passes correct props to child components', () => {
    const mockSendMessage = vi.fn();
    const mockMessages: Message[] = [
      { id: '1', text: 'Test message', isUser: true, source: 'User' }
    ];

    vi.mocked(useChatModel).mockReturnValue({
      ready: true,
      text: null,
      messages: mockMessages,
      isLoading: false,
      sendMessage: mockSendMessage
    });

    render(<App />);

    // Verify ChatMessages receives messages prop
    expect(screen.getByText('Test message')).toBeInTheDocument();

    // Verify ChatInput receives correct props
    const input = screen.getByPlaceholderText('Type a message...');
    expect(input).not.toBeDisabled();
    expect(input.closest('.chat-input-container')).toBeInTheDocument();
  });
}); 