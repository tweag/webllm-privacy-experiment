import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ChatMessage } from './ChatMessage';
import { Message } from '../models/message';

describe('ChatMessage', () => {
  it('renders user message correctly', () => {
    const message: Message = {
      id: '1',
      text: 'Hello, world!',
      isUser: true,
      source: 'User'
    };
    
    render(<ChatMessage message={message} />);
    
    const messageElement = screen.getByText('Hello, world!');
    expect(messageElement).toBeInTheDocument();
    expect(messageElement.closest('.message')).toHaveClass('user');
  });

  it('renders AI message correctly', () => {
    const message: Message = {
      id: '2',
      text: 'Hello, I am an AI!',
      isUser: false,
      source: 'AI'
    };
    
    render(<ChatMessage message={message} />);
    
    const messageElement = screen.getByText('Hello, I am an AI!');
    expect(messageElement).toBeInTheDocument();
    expect(messageElement.closest('.message')).toHaveClass('ai');
  });
}); 