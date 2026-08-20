import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { LandingPage } from '../LandingPage';

describe('LandingPage Component', () => {
  it('renders correctly and calls onLoginClick', () => {
    const mockOnLoginClick = vi.fn();
    render(<LandingPage onLoginClick={mockOnLoginClick} />);
    
    // Check elements
    expect(screen.getByText('Master any subject with')).toBeInTheDocument();
    expect(screen.getByText('spaced repetition.')).toBeInTheDocument();
    
    // Click Get Started
    const getStartedBtns = screen.getAllByText('Get Started');
    fireEvent.click(getStartedBtns[0]);
    expect(mockOnLoginClick).toHaveBeenCalled();
  });
});
