import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { SubscriptionPage } from '../SubscriptionPage';

describe('SubscriptionPage Component', () => {
  it('renders correctly and toggles billing cycles', () => {
    const mockOnClose = vi.fn();
    render(<SubscriptionPage onClose={mockOnClose} currentPlan="free" />);
    
    // Check elements
    expect(screen.getByText('Supercharge your memory.')).toBeInTheDocument();
    
    // Default is yearly
    expect(screen.getByText('$7.99')).toBeInTheDocument();
    
    const monthlyBtn = screen.getByText('Monthly');
    fireEvent.click(monthlyBtn);
    expect(screen.getByText('$9.99')).toBeInTheDocument();
    
    // Click close
    const closeBtn = screen.getByRole('button', { name: '' }); // X icon button doesn't have name right now, let's find it by some other means
  });
  
  it('calls onClose when X button is clicked', () => {
    const mockOnClose = vi.fn();
    const { container } = render(<SubscriptionPage onClose={mockOnClose} />);
    
    const buttons = container.querySelectorAll('button');
    const closeButton = buttons[0]; // Assuming it's the first button
    fireEvent.click(closeButton);
    
    expect(mockOnClose).toHaveBeenCalled();
  });
});
