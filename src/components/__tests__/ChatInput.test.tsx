import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ChatInput } from '../ChatInput';

describe('ChatInput', () => {
  it('renders input field and button', () => {
    const onSendMessage = vi.fn();
    render(<ChatInput onSendMessage={onSendMessage} />);
    
    expect(screen.getByPlaceholderText('Type a message...')).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('calls onSendMessage when button is clicked', () => {
    const onSendMessage = vi.fn();
    render(<ChatInput onSendMessage={onSendMessage} />);
    
    const input = screen.getByPlaceholderText('Type a message...');
    const button = screen.getByRole('button');
    
    fireEvent.change(input, { target: { value: 'test message' } });
    fireEvent.click(button);
    
    expect(onSendMessage).toHaveBeenCalledWith('test message');
  });

  it('calls onSendMessage when Enter is pressed', () => {
    const onSendMessage = vi.fn();
    render(<ChatInput onSendMessage={onSendMessage} />);
    
    const input = screen.getByPlaceholderText('Type a message...');
    
    fireEvent.change(input, { target: { value: 'test message' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });
    
    expect(onSendMessage).toHaveBeenCalledWith('test message');
  });

  it('clears input after sending message', () => {
    const onSendMessage = vi.fn();
    render(<ChatInput onSendMessage={onSendMessage} />);
    
    const input = screen.getByPlaceholderText('Type a message...');
    
    fireEvent.change(input, { target: { value: 'test message' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });
    
    expect(input).toHaveValue('');
  });

  it('shows warning when token count is near limit', () => {
    const onSendMessage = vi.fn();
    render(<ChatInput onSendMessage={onSendMessage} maxTokens={10} />);
    
    const input = screen.getByPlaceholderText('Type a message...');
    fireEvent.change(input, { target: { value: 'one two three four five six seven eight nine ten' } });
    
    expect(screen.getByText('10/10 words')).toBeInTheDocument();
    expect(screen.getByText('10/10 words')).toHaveClass('token-counter-warning');
  });

  it('disables input and shows loading state', () => {
    const onSendMessage = vi.fn();
    render(<ChatInput onSendMessage={onSendMessage} isLoading={true} />);
    
    const input = screen.getByPlaceholderText('Type a message...');
    const button = screen.getByRole('button');
    
    expect(input).toBeDisabled();
    expect(button).toBeDisabled();
    expect(button).toHaveClass('loading');
    expect(button).toHaveTextContent('•');
  });

  it('disables button when message is empty or over token limit', () => {
    const onSendMessage = vi.fn();
    render(<ChatInput onSendMessage={onSendMessage} maxTokens={5} />);
    
    const input = screen.getByPlaceholderText('Type a message...');
    const button = screen.getByRole('button');
    
    // Empty message
    expect(button).toBeDisabled();
    
    // Message over token limit
    fireEvent.change(input, { target: { value: 'one two three four five six' } });
    expect(button).toBeDisabled();
  });
}); 