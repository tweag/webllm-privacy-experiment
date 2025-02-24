import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ModelDownloadProgress } from './ModelDownloadProgress';

describe('ModelDownloadProgress', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders with initial state', () => {
    render(<ModelDownloadProgress text={null} />);
    
    expect(screen.getByText('Preparing Model')).toBeInTheDocument();
    expect(screen.getByText('0s')).toBeInTheDocument();
  });

  it('displays download text when provided', () => {
    const downloadText = 'Downloading model files...';
    render(<ModelDownloadProgress text={downloadText} />);
    
    expect(screen.getByText(downloadText)).toBeInTheDocument();
  });

  it('updates timer every second', () => {
    render(<ModelDownloadProgress text={null} />);
    
    expect(screen.getByText('0s')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(screen.getByText('1s')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(screen.getByText('2s')).toBeInTheDocument();
  });

  it('cleans up timer on unmount', () => {
    const { unmount } = render(<ModelDownloadProgress text={null} />);
    
    const clearIntervalSpy = vi.spyOn(window, 'clearInterval');
    
    unmount();
    
    expect(clearIntervalSpy).toHaveBeenCalled();
  });
}); 