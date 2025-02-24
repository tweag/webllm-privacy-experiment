import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ChatMessage } from './ChatMessage';
import { Message } from '../../types/message';

describe('ChatMessage', () => {
  it('renders user message correctly', () => {
    const message: Message = {
      id: 1,
      text: 'Hello',
      isUser: true,
      source: 'User'
    };
    
    render(<ChatMessage message={message} />);
    
    const messageElement = screen.getByText('Hello');
    expect(messageElement).toBeInTheDocument();
    expect(messageElement.closest('.message')).toHaveClass('user');
  });

  it('renders AI message correctly', () => {
    const message: Message = {
      id: 2,
      text: 'Hi there!',
      isUser: false,
      source: 'WebLLM'
    };
    
    render(<ChatMessage message={message} />);
    
    const messageElement = screen.getByText('Hi there!');
    expect(messageElement).toBeInTheDocument();
    expect(messageElement.closest('.message')).toHaveClass('ai');
  });
}); 