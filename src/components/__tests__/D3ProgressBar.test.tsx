import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { D3ProgressBar } from '../D3ProgressBar';

describe('D3ProgressBar Component', () => {
  it('renders without crashing when there are no cards', () => {
    render(<D3ProgressBar mastered={0} total={0} />);
    expect(screen.getByText('No cards')).toBeInTheDocument();
  });

  it('renders percentage and svg correctly', () => {
    const { container } = render(<D3ProgressBar mastered={5} total={10} />);
    expect(screen.getByText('50%')).toBeInTheDocument();
    
    // Check if SVG is rendered
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });
});
