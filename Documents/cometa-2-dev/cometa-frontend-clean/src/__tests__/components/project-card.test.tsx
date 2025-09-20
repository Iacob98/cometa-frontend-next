import { describe, it, expect, vi } from 'vitest';
import { render, screen, userEvent } from '../utils/test-utils';
import { ProjectCard } from '@/components/projects/project-card';
import type { Project } from '@/types';

const mockProject: Project = {
  id: 'test-project-id',
  name: 'Test Project Alpha',
  customer: 'ACME Corporation',
  city: 'Berlin',
  status: 'active',
  totalLength: 5000,
  ratePerMeter: 25,
  startDate: '2024-01-01',
  endDate: '2024-12-31',
  pmUserId: 'pm-user-id',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

describe('ProjectCard', () => {
  it('renders project information correctly', () => {
    render(<ProjectCard project={mockProject} />);

    expect(screen.getByText('Test Project Alpha')).toBeInTheDocument();
    expect(screen.getByText('ACME Corporation')).toBeInTheDocument();
    expect(screen.getByText('Berlin')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('5,000 m')).toBeInTheDocument();
    expect(screen.getByText('€25/m')).toBeInTheDocument();
  });

  it('displays correct status badge colors', () => {
    // Test active status
    const { rerender } = render(<ProjectCard project={mockProject} />);
    expect(screen.getByText('Active')).toHaveClass('bg-green-100', 'text-green-800');

    // Test completed status
    rerender(<ProjectCard project={{ ...mockProject, status: 'completed' }} />);
    expect(screen.getByText('Completed')).toHaveClass('bg-blue-100', 'text-blue-800');

    // Test planning status
    rerender(<ProjectCard project={{ ...mockProject, status: 'planning' }} />);
    expect(screen.getByText('Planning')).toHaveClass('bg-yellow-100', 'text-yellow-800');

    // Test on-hold status
    rerender(<ProjectCard project={{ ...mockProject, status: 'on-hold' }} />);
    expect(screen.getByText('On Hold')).toHaveClass('bg-orange-100', 'text-orange-800');
  });

  it('handles click events correctly', async () => {
    const onClickMock = vi.fn();
    const user = userEvent.setup();

    render(<ProjectCard project={mockProject} onClick={onClickMock} />);

    const card = screen.getByRole('button');
    await user.click(card);

    expect(onClickMock).toHaveBeenCalledWith(mockProject.id);
    expect(onClickMock).toHaveBeenCalledTimes(1);
  });

  it('formats dates correctly', () => {
    render(<ProjectCard project={mockProject} />);

    expect(screen.getByText('01.01.2024')).toBeInTheDocument();
    expect(screen.getByText('31.12.2024')).toBeInTheDocument();
  });

  it('handles missing end date', () => {
    const projectWithoutEndDate = { ...mockProject, endDate: undefined };
    render(<ProjectCard project={projectWithoutEndDate} />);

    expect(screen.getByText('01.01.2024')).toBeInTheDocument();
    expect(screen.getByText('Ongoing')).toBeInTheDocument();
  });

  it('calculates project value correctly', () => {
    render(<ProjectCard project={mockProject} />);

    // totalLength (5000) * ratePerMeter (25) = 125,000
    expect(screen.getByText('€125,000')).toBeInTheDocument();
  });

  it('displays progress indicator when progress prop is provided', () => {
    render(<ProjectCard project={mockProject} progress={75} />);

    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toBeInTheDocument();
    expect(progressBar).toHaveAttribute('aria-valuenow', '75');
    expect(screen.getByText('75%')).toBeInTheDocument();
  });

  it('shows actions menu when showActions is true', async () => {
    const user = userEvent.setup();
    render(<ProjectCard project={mockProject} showActions />);

    const actionsButton = screen.getByRole('button', { name: /more actions/i });
    expect(actionsButton).toBeInTheDocument();

    await user.click(actionsButton);

    expect(screen.getByText('Edit')).toBeInTheDocument();
    expect(screen.getByText('View Details')).toBeInTheDocument();
    expect(screen.getByText('Archive')).toBeInTheDocument();
  });

  it('handles action clicks correctly', async () => {
    const onEditMock = vi.fn();
    const onViewMock = vi.fn();
    const onArchiveMock = vi.fn();
    const user = userEvent.setup();

    render(
      <ProjectCard
        project={mockProject}
        showActions
        onEdit={onEditMock}
        onView={onViewMock}
        onArchive={onArchiveMock}
      />
    );

    const actionsButton = screen.getByRole('button', { name: /more actions/i });
    await user.click(actionsButton);

    // Test edit action
    await user.click(screen.getByText('Edit'));
    expect(onEditMock).toHaveBeenCalledWith(mockProject.id);

    // Re-open menu for next action
    await user.click(actionsButton);
    await user.click(screen.getByText('View Details'));
    expect(onViewMock).toHaveBeenCalledWith(mockProject.id);

    // Re-open menu for next action
    await user.click(actionsButton);
    await user.click(screen.getByText('Archive'));
    expect(onArchiveMock).toHaveBeenCalledWith(mockProject.id);
  });

  it('applies hover effects correctly', async () => {
    const user = userEvent.setup();
    render(<ProjectCard project={mockProject} />);

    const card = screen.getByRole('button');

    await user.hover(card);
    expect(card).toHaveClass('hover:shadow-md');

    await user.unhover(card);
    expect(card).not.toHaveClass('shadow-md');
  });

  it('is accessible with proper ARIA attributes', () => {
    render(<ProjectCard project={mockProject} />);

    const card = screen.getByRole('button');
    expect(card).toHaveAttribute('aria-label', expect.stringContaining('Test Project Alpha'));
    expect(card).toHaveAttribute('tabIndex', '0');
  });

  it('handles keyboard navigation', async () => {
    const onClickMock = vi.fn();
    const user = userEvent.setup();

    render(<ProjectCard project={mockProject} onClick={onClickMock} />);

    const card = screen.getByRole('button');
    card.focus();

    await user.keyboard('{Enter}');
    expect(onClickMock).toHaveBeenCalledWith(mockProject.id);

    await user.keyboard('{Space}');
    expect(onClickMock).toHaveBeenCalledTimes(2);
  });

  it('displays loading state correctly', () => {
    render(<ProjectCard project={mockProject} isLoading />);

    expect(screen.getByTestId('project-card-skeleton')).toBeInTheDocument();
    expect(screen.queryByText('Test Project Alpha')).not.toBeInTheDocument();
  });

  it('handles long project names gracefully', () => {
    const longNameProject = {
      ...mockProject,
      name: 'This is a very long project name that should be truncated when it exceeds the maximum width of the card component',
    };

    render(<ProjectCard project={longNameProject} />);

    const nameElement = screen.getByText(longNameProject.name);
    expect(nameElement).toHaveClass('truncate');
  });

  it('formats large numbers correctly', () => {
    const largeProject = {
      ...mockProject,
      totalLength: 50000,
      ratePerMeter: 125,
    };

    render(<ProjectCard project={largeProject} />);

    expect(screen.getByText('50,000 m')).toBeInTheDocument();
    expect(screen.getByText('€6,250,000')).toBeInTheDocument();
  });
});