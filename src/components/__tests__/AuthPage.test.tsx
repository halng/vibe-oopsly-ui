import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthPage } from '../AuthPage';
import { ApiService } from '../../services/api';

vi.mock('../../services/api', () => ({
  ApiService: {
    sendOtp: vi.fn(),
    verifyOtp: vi.fn(),
    demoLogin: vi.fn(),
  }
}));

describe('AuthPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders login form by default and toggles to signup', () => {
    render(<AuthPage onSuccess={vi.fn()} />);
    
    expect(screen.getByText('Welcome back')).toBeInTheDocument();
    
    // Toggle to signup
    fireEvent.click(screen.getByText('Sign up'));
    expect(screen.getByText('Create an account')).toBeInTheDocument();
    expect(screen.getByText('Full Name')).toBeInTheDocument();
  });

  it('handles demo login', async () => {
    const mockOnSuccess = vi.fn();
    (ApiService.demoLogin as any).mockResolvedValue({
      isSuccess: true,
      data: { user: { id: 'demo1' } }
    });
    
    render(<AuthPage onSuccess={mockOnSuccess} />);
    
    fireEvent.click(screen.getByText('Quick Demo Login'));
    
    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalledWith({ id: 'demo1' });
    });
  });
});
