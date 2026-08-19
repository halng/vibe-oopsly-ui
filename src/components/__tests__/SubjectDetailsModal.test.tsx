import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { SubjectDetailsModal } from '../SubjectDetailsModal';
import { Subject } from '../../types';

// Mock dependencies
vi.mock('../../services/api', () => ({
  ApiService: {
    getSubject: vi.fn().mockResolvedValue({ isSuccess: true, data: { cards: [], testSuites: [] } }),
  }
}));

const mockSubject: Subject = {
  id: 'subj_1',
  shelfId: 'shelf_1',
  title: 'Test Subject',
  description: 'Test Description',
  isPublic: false,
  isDeleted: false,
  cardCount: 0,
  dueCount: 0,
  tags: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

describe('SubjectDetailsModal Component', () => {
  it('renders subject title and description', async () => {
    const mockOnClose = vi.fn();
    
    render(
      <SubjectDetailsModal 
        subject={mockSubject}
        onClose={mockOnClose}
        onStartReview={vi.fn()}
        onStartLearn={vi.fn()}
        onStartMatch={vi.fn()}
        onStartTest={vi.fn()}
        onHostMultiplayer={vi.fn()}
        onRefreshSubjects={vi.fn()}
      />
    );
    
    expect(screen.getByText('Test Subject')).toBeInTheDocument();
    expect(screen.getByText('Test Description')).toBeInTheDocument();
    
    // Wait for the async loadData to complete to avoid act() warnings
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });
  });

  it('calls onClose when X button is clicked', async () => {
    const mockOnClose = vi.fn();
    
    const { container } = render(
      <SubjectDetailsModal 
        subject={mockSubject}
        onClose={mockOnClose}
        onStartReview={vi.fn()}
        onStartLearn={vi.fn()}
        onStartMatch={vi.fn()}
        onStartTest={vi.fn()}
        onHostMultiplayer={vi.fn()}
        onRefreshSubjects={vi.fn()}
      />
    );
    
    // Find the close button (Lucide X icon is rendered inside a button)
    const closeButton = container.querySelector('button');
    if (closeButton) {
      fireEvent.click(closeButton);
    }
    
    expect(mockOnClose).toHaveBeenCalled();
    
    // Wait for the async loadData to complete
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });
  });
});
