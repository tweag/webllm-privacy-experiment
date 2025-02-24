import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ChatMessages } from './ChatMessages';
import { Message } from '../models/message';

describe('ChatMessages', () => {
  const messages: Message[] = [
    {
      id: '1',
      text: 'Hello',
      isUser: true,
      source: 'User'
    },
    {
      id: '2',
      text: 'Hi there!',
      isUser: false,
      source: 'AI'
    }
  ];

  it('renders messages correctly', () => {
    render(<ChatMessages messages={messages} />);
    
    expect(screen.getByText('Hello')).toBeInTheDocument();
    expect(screen.getByText('Hi there!')).toBeInTheDocument();
  });

  it('renders message sources correctly', () => {
    render(<ChatMessages messages={messages} />);
    
    expect(screen.getByText('You')).toBeInTheDocument();
    expect(screen.getByText('AI')).toBeInTheDocument();
  });

  it('displays correct source labels', () => {
    render(<ChatMessages messages={messages} />);
    
    expect(screen.getByText('You')).toBeInTheDocument();
    expect(screen.getByText('AI')).toBeInTheDocument();
  });

  it('applies correct CSS classes', () => {
    render(<ChatMessages messages={messages} />);
    
    const userMessage = screen.getByText('Hello').closest('.message');
    const aiMessage = screen.getByText('Hi there!').closest('.message');
    
    expect(userMessage).toHaveClass('user');
    expect(aiMessage).toHaveClass('ai');
  });

  it('handles empty message list', () => {
    render(<ChatMessages messages={[]} />);
    
    const container = screen.getByTestId('chat-container');
    expect(container.querySelector('.message')).toBeNull();
  });

  it('displays default AI source when source is undefined', () => {
    const messages: Message[] = [
      { id: '1', text: 'AI response', isUser: false }
    ];
    
    render(<ChatMessages messages={messages} />);
    
    expect(screen.getByText('AI')).toBeInTheDocument();
  });
});