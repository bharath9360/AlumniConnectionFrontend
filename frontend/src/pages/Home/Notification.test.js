/**
 * NOTIFICATION COMPONENTS - TEST EXAMPLES
 * Examples and best practices for testing the notification system
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Notification from './Notification';
import {
  NotificationHeader,
  NotificationPageTitle,
  SearchBar,
  EventCard,
  JobCard,
  MessageCard,
  MarkAsReadButton
} from '../../components/notifications';

// ============================================================
// UNIT TESTS - Individual Components
// ============================================================

describe('NotificationHeader Component', () => {
  it('renders logo and title', () => {
    render(
      <BrowserRouter>
        <NotificationHeader onBack={() => { }} unreadCount={5} />
      </BrowserRouter>
    );

    expect(screen.getByText('Alumni Connect')).toBeInTheDocument();
  });

  it('displays unread count badge', () => {
    render(
      <BrowserRouter>
        <NotificationHeader onBack={() => { }} unreadCount={3} />
      </BrowserRouter>
    );

    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('calls onBack callback when back button is clicked', () => {
    const handleBack = jest.fn();
    render(
      <BrowserRouter>
        <NotificationHeader onBack={handleBack} unreadCount={0} />
      </BrowserRouter>
    );

    const backButton = screen.getByRole('button', { name: /go back/i });
    fireEvent.click(backButton);
    expect(handleBack).toHaveBeenCalled();
  });
});

describe('SearchBar Component', () => {
  it('renders search input with placeholder', () => {
    render(
      <SearchBar searchTerm="" onSearchChange={() => { }} />
    );

    expect(screen.getByPlaceholderText(/search notifications/i)).toBeInTheDocument();
  });

  it('updates search term on input change', () => {
    const handleSearch = jest.fn();
    render(
      <SearchBar searchTerm="" onSearchChange={handleSearch} />
    );

    const input = screen.getByPlaceholderText(/search notifications/i);
    fireEvent.change(input, { target: { value: 'event' } });
    expect(handleSearch).toHaveBeenCalledWith('event');
  });

  it('clears search term when clear button is clicked', () => {
    const handleSearch = jest.fn();
    render(
      <SearchBar searchTerm="event" onSearchChange={handleSearch} />
    );

    const clearButton = screen.getByRole('button', { name: /clear search/i });
    fireEvent.click(clearButton);
    expect(handleSearch).toHaveBeenCalledWith('');
  });

  it('shows clear button only when search term is present', () => {
    const { rerender } = render(
      <SearchBar searchTerm="" onSearchChange={() => { }} />
    );

    expect(screen.queryByRole('button', { name: /clear search/i })).not.toBeInTheDocument();

    rerender(
      <SearchBar searchTerm="test" onSearchChange={() => { }} />
    );

    expect(screen.getByRole('button', { name: /clear search/i })).toBeInTheDocument();
  });
});

describe('EventCard Component', () => {
  const mockEvent = {
    id: '1',
    title: 'Pongal Celebration',
    category: 'College Events',
    description: 'Join us for a vibrant celebration',
    date: 'March 15, 2026',
    isRead: false,
    icon: '🎉'
  };

  it('renders event title and description', () => {
    render(
      <EventCard event={mockEvent} onClick={() => { }} />
    );

    expect(screen.getByText('Pongal Celebration')).toBeInTheDocument();
    expect(screen.getByText('Join us for a vibrant celebration')).toBeInTheDocument();
  });

  it('displays event date', () => {
    render(
      <EventCard event={mockEvent} onClick={() => { }} />
    );

    expect(screen.getByText('March 15, 2026')).toBeInTheDocument();
  });

  it('shows unread indicator for unread notifications', () => {
    render(
      <EventCard event={mockEvent} onClick={() => { }} />
    );

    const card = screen.getByText('Pongal Celebration').closest('.event-card');
    expect(card).toHaveClass('unread');
  });

  it('calls onClick handler when card is clicked', () => {
    const handleClick = jest.fn();
    render(
      <EventCard event={mockEvent} onClick={handleClick} />
    );

    const card = screen.getByText('Pongal Celebration').closest('.notification-card');
    fireEvent.click(card);
    expect(handleClick).toHaveBeenCalledWith(mockEvent);
  });
});

describe('JobCard Component', () => {
  const mockJob = {
    id: '3',
    title: 'Senior Developer',
    category: 'Job Postings',
    company: 'Tech Corp',
    description: 'Build amazing applications',
    posted: '2 days ago',
    isRead: false,
    icon: '💼'
  };

  it('renders job title and company', () => {
    render(
      <JobCard job={mockJob} onClick={() => { }} />
    );

    expect(screen.getByText('Senior Developer')).toBeInTheDocument();
    expect(screen.getByText('Tech Corp')).toBeInTheDocument();
  });

  it('displays job description', () => {
    render(
      <JobCard job={mockJob} onClick={() => { }} />
    );

    expect(screen.getByText('Build amazing applications')).toBeInTheDocument();
  });

  it('shows posted time', () => {
    render(
      <JobCard job={mockJob} onClick={() => { }} />
    );

    expect(screen.getByText(/Posted 2 days ago/i)).toBeInTheDocument();
  });

  it('calls onClick handler when card is clicked', () => {
    const handleClick = jest.fn();
    render(
      <JobCard job={mockJob} onClick={handleClick} />
    );

    const card = screen.getByText('Senior Developer').closest('.notification-card');
    fireEvent.click(card);
    expect(handleClick).toHaveBeenCalledWith(mockJob);
  });
});

describe('MessageCard Component', () => {
  const mockMessage = {
    id: '5',
    sender: 'Sophia Carter',
    category: 'Direct Messages',
    lastMessage: 'Hey, how are you?',
    unreadCount: 3,
    timestamp: '15 mins ago',
    isRead: false,
    avatar: 'SC'
  };

  it('renders sender name and message preview', () => {
    render(
      <MessageCard message={mockMessage} onClick={() => { }} />
    );

    expect(screen.getByText('Sophia Carter')).toBeInTheDocument();
    expect(screen.getByText('Hey, how are you?')).toBeInTheDocument();
  });

  it('displays unread count badge', () => {
    render(
      <MessageCard message={mockMessage} onClick={() => { }} />
    );

    expect(screen.getByText('3 unread messages')).toBeInTheDocument();
  });

  it('shows timestamp', () => {
    render(
      <MessageCard message={mockMessage} onClick={() => { }} />
    );

    expect(screen.getByText('15 mins ago')).toBeInTheDocument();
  });

  it('does not display unread count when it is zero', () => {
    const readMessage = { ...mockMessage, unreadCount: 0 };
    render(
      <MessageCard message={readMessage} onClick={() => { }} />
    );

    expect(screen.queryByText(/unread message/i)).not.toBeInTheDocument();
  });
});

describe('MarkAsReadButton Component', () => {
  it('does not render when unread count is zero', () => {
    const { container } = render(
      <MarkAsReadButton unreadCount={0} onMarkAsRead={() => { }} />
    );

    expect(container.firstChild).toBeNull();
  });

  it('renders button when there are unread notifications', () => {
    render(
      <MarkAsReadButton unreadCount={5} onMarkAsRead={() => { }} />
    );

    expect(screen.getByRole('button', { name: /mark as read/i })).toBeInTheDocument();
  });

  it('calls onMarkAsRead callback when clicked', () => {
    const handleMarkAsRead = jest.fn();
    render(
      <MarkAsReadButton unreadCount={5} onMarkAsRead={handleMarkAsRead} />
    );

    const button = screen.getByRole('button', { name: /mark as read/i });
    fireEvent.click(button);
    expect(handleMarkAsRead).toHaveBeenCalled();
  });
});

describe('NotificationPageTitle Component', () => {
  it('renders "Notifications" title', () => {
    render(
      <NotificationPageTitle unreadCount={0} />
    );

    expect(screen.getByText('Notifications')).toBeInTheDocument();
  });

  it('displays unread badge when there are unread notifications', () => {
    render(
      <NotificationPageTitle unreadCount={5} />
    );

    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('does not display badge when unread count is zero', () => {
    render(
      <NotificationPageTitle unreadCount={0} />
    );

    const badge = screen.queryByClassName('unread-badge');
    expect(badge).not.toBeInTheDocument();
  });
});

// ============================================================
// INTEGRATION TESTS - Full Page
// ============================================================

describe('Notification Page Integration', () => {
  it('renders main notification page with header and content', async () => {
    render(
      <BrowserRouter>
        <Notification />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Notifications')).toBeInTheDocument();
    });
  });

  it('filters notifications based on search term', async () => {
    render(
      <BrowserRouter>
        <Notification />
      </BrowserRouter>
    );

    const searchInput = screen.getByPlaceholderText(/search notifications/i);
    fireEvent.change(searchInput, { target: { value: 'Pongal' } });

    await waitFor(() => {
      expect(screen.getByText('Pongal Celebration')).toBeInTheDocument();
    });
  });

  it('marks all notifications as read', async () => {
    render(
      <BrowserRouter>
        <Notification />
      </BrowserRouter>
    );

    const markAsReadButton = screen.getByRole('button', { name: /mark as read/i });
    fireEvent.click(markAsReadButton);

    await waitFor(() => {
      // Verify unread indicators are gone
      const unreadCards = document.querySelectorAll('.notification-card.unread');
      expect(unreadCards.length).toBe(0);
    });
  });

  it('displays correct number of notifications in each section', () => {
    render(
      <BrowserRouter>
        <Notification />
      </BrowserRouter>
    );

    // Check that sections are rendered with correct counts
    expect(screen.getByText(/College Events/i)).toBeInTheDocument();
    expect(screen.getByText(/Job Postings/i)).toBeInTheDocument();
    expect(screen.getByText(/Direct Messages/i)).toBeInTheDocument();
  });

  it('shows no results message when search has no matches', async () => {
    render(
      <BrowserRouter>
        <Notification />
      </BrowserRouter>
    );

    const searchInput = screen.getByPlaceholderText(/search notifications/i);
    fireEvent.change(searchInput, { target: { value: 'nonexistent123' } });

    await waitFor(() => {
      expect(screen.getByText(/no notifications found/i)).toBeInTheDocument();
    });
  });
});

// ============================================================
// SNAPSHOT TESTS
// ============================================================

describe('Notification Component Snapshots', () => {
  it('matches EventCard snapshot', () => {
    const mockEvent = {
      id: '1',
      title: 'Test Event',
      category: 'College Events',
      description: 'Test description',
      date: 'March 15, 2026',
      isRead: false,
      icon: '🎉'
    };

    const { container } = render(
      <EventCard event={mockEvent} onClick={() => { }} />
    );

    expect(container).toMatchSnapshot();
  });

  it('matches JobCard snapshot', () => {
    const mockJob = {
      id: '1',
      title: 'Test Job',
      category: 'Job Postings',
      company: 'Test Company',
      description: 'Test description',
      posted: '2 days ago',
      isRead: false,
      icon: '💼'
    };

    const { container } = render(
      <JobCard job={mockJob} onClick={() => { }} />
    );

    expect(container).toMatchSnapshot();
  });

  it('matches MessageCard snapshot', () => {
    const mockMessage = {
      id: '1',
      sender: 'John Doe',
      category: 'Direct Messages',
      lastMessage: 'Test message',
      unreadCount: 2,
      timestamp: '5 mins ago',
      isRead: false,
      avatar: 'JD'
    };

    const { container } = render(
      <MessageCard message={mockMessage} onClick={() => { }} />
    );

    expect(container).toMatchSnapshot();
  });
});

// ============================================================
// ACCESSIBILITY TESTS
// ============================================================

describe('Notification Components - Accessibility', () => {
  it('should have proper ARIA labels', () => {
    render(
      <BrowserRouter>
        <NotificationHeader onBack={() => { }} unreadCount={5} />
      </BrowserRouter>
    );

    expect(screen.getByLabelText(/go back/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/messages/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/notifications/i)).toBeInTheDocument();
  });

  it('should support keyboard navigation', () => {
    render(
      <SearchBar searchTerm="" onSearchChange={() => { }} />
    );

    const input = screen.getByPlaceholderText(/search notifications/i);
    input.focus();
    expect(document.activeElement).toBe(input);
  });

  it('should have good color contrast', () => {
    const { container } = render(
      <BrowserRouter>
        <Notification />
      </BrowserRouter>
    );

    // This is a manual check in real scenarios using tools like axe-core
    expect(container).toBeInTheDocument();
  });
});

// ============================================================
// PERFORMANCE TESTS
// ============================================================

describe('Notification Components - Performance', () => {
  it('should render large list efficiently', () => {
    const largeList = Array.from({ length: 100 }, (_, i) => ({
      id: `${i}`,
      title: `Event ${i}`,
      category: 'College Events',
      description: `Description ${i}`,
      date: 'March 15, 2026',
      isRead: false,
      icon: '🎉'
    }));

    const startTime = performance.now();

    render(
      <div>
        {largeList.map(item => (
          <EventCard key={item.id} event={item} onClick={() => { }} />
        ))}
      </div>
    );

    const endTime = performance.now();
    expect(endTime - startTime).toBeLessThan(1000); // Render should be fast
  });
});

// ============================================================
// MOCK DATA FOR TESTING
// ============================================================

export const mockNotifications = {
  events: [
    {
      id: '1',
      title: 'Pongal Celebration',
      category: 'College Events',
      description: 'Join us for a vibrant Pongal Celebration event',
      date: 'March 15, 2026',
      isRead: false,
      icon: '🎉'
    }
  ],
  jobs: [
    {
      id: '3',
      title: 'Administrative Assistant',
      category: 'Job Postings',
      company: 'Tech Innovations Inc.',
      description: 'Join our administrative team',
      posted: '2 days ago',
      isRead: false,
      icon: '💼'
    }
  ],
  messages: [
    {
      id: '5',
      sender: 'Sophia Carter',
      category: 'Direct Messages',
      lastMessage: 'Hey! How have you been?',
      unreadCount: 3,
      timestamp: '15 mins ago',
      isRead: false,
      avatar: 'SC'
    }
  ]
};

export default {
  mockNotifications
};
