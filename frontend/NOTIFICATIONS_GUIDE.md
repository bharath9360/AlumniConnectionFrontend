# Alumni Connect - Notifications Page Documentation

## 📋 Overview

This is a comprehensive Notifications Page component system for the Alumni Connect web application. The page displays notifications organized into three main categories: **College Events**, **Job Postings**, and **Direct Messages**. Built with **React** and **compound components** pattern for maximum reusability.

## 🎯 Features

✅ **Responsive Design** - Works seamlessly on desktop, tablet, and mobile devices  
✅ **Search Functionality** - Filter notifications across all categories  
✅ **Mark as Read** - Quick action to mark all notifications as read  
✅ **Categorized Sections** - Events, jobs, and messages organized separately  
✅ **Unread Badges** - Visual indicators for unread notifications  
✅ **Compound Components** - Reusable, composable component architecture  
✅ **Smooth Animations** - Polished UI with transitions and interactions  
✅ **Dark Mode Ready** - CSS variable-based theming support  

---

## 📁 File Structure

```
src/
├── pages/Home/
│   └── Notification.js              # Main page component
├── components/notifications/
│   └── index.js                     # Compound components library
└── styles/
    └── Notification.css             # All notification styles
```

---

## 🧩 Component Architecture

### 1. **Notification** (Main Page)
The page container that orchestrates all sub-components.

**Location:** `src/pages/Home/Notification.js`

**Props:** None (uses React Router navigation)

**Key Features:**
- Manages notification state
- Handles search filtering
- Controls "Mark as Read" functionality
- Renders categorized sections

**Example Usage:**
```jsx
import Notification from '../pages/Home/Notification';

<Notification />
```

---

### 2. **NotificationHeader** 
Top navigation bar with logo, menu, icons, and profile.

**Location:** `src/components/notifications/index.js`

**Props:**
```jsx
{
  onBack: Function,        // Callback for back button
  unreadCount: Number      // Total unread notifications
}
```

**Features:**
- Back arrow navigation
- Alumni Connect logo and branding
- Navigation menu (Home, Job, Events)
- Message and notification icons
- Student profile section

**Example Usage:**
```jsx
<NotificationHeader 
  onBack={() => navigate(-1)} 
  unreadCount={5} 
/>
```

---

### 3. **NotificationPageTitle**
Displays the page title with unread count badge.

**Props:**
```jsx
{
  unreadCount: Number      // Number of unread notifications
}
```

**Features:**
- Large, bold "Notifications" heading
- Unread count badge (conditional display)

**Example Usage:**
```jsx
<NotificationPageTitle unreadCount={5} />
```

---

### 4. **MarkAsReadButton**
Button to mark all notifications as read.

**Props:**
```jsx
{
  unreadCount: Number,     // Current unread count
  onMarkAsRead: Function   // Callback to handle mark as read
}
```

**Features:**
- Icon with text
- Only appears when there are unread notifications
- Smooth hover effects

**Example Usage:**
```jsx
<MarkAsReadButton 
  unreadCount={5}
  onMarkAsRead={handleMarkAsRead}
/>
```

---

### 5. **SearchBar**
Search input with icon and clear functionality.

**Props:**
```jsx
{
  searchTerm: String,      // Current search value
  onSearchChange: Function // Callback for search input changes
}
```

**Features:**
- Search icon placeholder
- Clear button (appears when text is entered)
- Focus states and transitions

**Example Usage:**
```jsx
<SearchBar 
  searchTerm={search}
  onSearchChange={setSearch}
/>
```

---

### 6. **NotificationSection** ⭐ (Reusable)
Container for grouped notifications with category header.

**Props:**
```jsx
{
  title: String,           // Section title (e.g., "College Events")
  count: Number,           // Number of items in section
  icon: String,            // Emoji or icon for section
  children: ReactNode      // Notification cards
}
```

**Features:**
- Customizable title and icon
- Item count badge
- Flexible children content

**Example Usage:**
```jsx
<NotificationSection 
  title="College Events"
  count={2}
  icon="📅"
>
  {events.map(event => <EventCard key={event.id} event={event} />)}
</NotificationSection>
```

---

### 7. **EventCard** ⭐ (Reusable)
Individual event notification card.

**Props:**
```jsx
{
  event: {
    id: String,
    title: String,
    category: String,
    description: String,
    date: String,
    isRead: Boolean,
    icon: String
  },
  onClick: Function         // Callback on card click
}
```

**Features:**
- Event icon with colored background
- Title with unread indicator
- Description preview
- Event date meta information
- Hover effects and animations

**Example Usage:**
```jsx
<EventCard 
  event={{
    id: '1',
    title: 'Pongal Celebration',
    category: 'College Events',
    description: 'Join us for a vibrant celebration...',
    date: 'March 15, 2026',
    isRead: false,
    icon: '🎉'
  }}
  onClick={handleEventClick}
/>
```

---

### 8. **JobCard** ⭐ (Reusable)
Individual job posting notification card.

**Props:**
```jsx
{
  job: {
    id: String,
    title: String,
    category: String,
    company: String,
    description: String,
    posted: String,
    isRead: Boolean,
    icon: String
  },
  onClick: Function         // Callback on card click
}
```

**Features:**
- Job icon with colored background
- Job title with unread indicator
- Company name with building icon
- Description preview
- "Posted" time meta information

**Example Usage:**
```jsx
<JobCard 
  job={{
    id: '3',
    title: 'Administrative Assistant',
    category: 'Job Postings',
    company: 'Tech Innovations Inc.',
    description: 'Join our administrative team...',
    posted: '2 days ago',
    isRead: false,
    icon: '💼'
  }}
  onClick={handleJobClick}
/>
```

---

### 9. **MessageCard** ⭐ (Reusable)
Individual direct message notification card.

**Props:**
```jsx
{
  message: {
    id: String,
    sender: String,
    category: String,
    lastMessage: String,
    unreadCount: Number,
    timestamp: String,
    isRead: Boolean,
    avatar: String           // Initials like "SC"
  },
  onClick: Function         // Callback on card click
}
```

**Features:**
- User avatar with initials
- Sender name with unread indicator
- Last message preview
- Unread message count badge
- Timestamp information

**Example Usage:**
```jsx
<MessageCard 
  message={{
    id: '5',
    sender: 'Sophia Carter',
    category: 'Direct Messages',
    lastMessage: 'Hey! How have you been?',
    unreadCount: 3,
    timestamp: '15 mins ago',
    isRead: false,
    avatar: 'SC'
  }}
  onClick={handleMessageClick}
/>
```

---

## 🔄 Reusing Components

### Creating a Custom Notification Section

You can reuse the `NotificationSection` and card components to create new notification types:

```jsx
import {
  NotificationSection,
  MessageCard
} from '../components/notifications';

function CustomNotifications() {
  const items = [
    {
      id: '1',
      sender: 'John Doe',
      lastMessage: 'Custom message here...',
      unreadCount: 2,
      timestamp: '5 mins ago',
      avatar: 'JD'
    }
  ];

  return (
    <NotificationSection 
      title="Custom Category"
      count={items.length}
      icon="✨"
    >
      {items.map(item => (
        <MessageCard key={item.id} message={item} onClick={() => {}} />
      ))}
    </NotificationSection>
  );
}
```

### Creating a New Card Type

Use the existing cards as templates to create new notification types:

```jsx
export const AnnounceCard = ({ announcement, onClick }) => {
  return (
    <div className="notification-card announcement-card">
      <div className="card-left">
        <div className="card-icon-wrapper">
          <span className="card-icon">{announcement.icon}</span>
        </div>
      </div>
      <div className="card-content">
        <div className="card-header">
          <h3 className="card-title">{announcement.title}</h3>
          {!announcement.isRead && <span className="unread-indicator"></span>}
        </div>
        <p className="card-description">{announcement.content}</p>
        <div className="card-meta">
          <span className="card-date">
            <i className="fas fa-calendar-alt"></i>
            {announcement.date}
          </span>
        </div>
      </div>
    </div>
  );
};
```

---

## 🎨 Theming & Customization

### CSS Variables

All colors are managed through CSS variables for easy customization:

```css
:root {
  --primary-red: #c84022;
  --primary-red-dark: #a1331b;
  --bg-light: #f8f9fa;
  --bg-white: #ffffff;
  --text-dark: #333333;
  --text-muted: #666666;
  --text-light: #999999;
  --border-color: #e8e8e8;
}
```

Override these in your own CSS or JavaScript:

```jsx
// Override for a specific component
<div style={{ '--primary-red': '#e84022' }}>
  <NotificationSection ... />
</div>
```

---

## 📊 State Management

The main `Notification` component manages:

1. **searchTerm** - Current search input value
2. **unreadNotifications** - All notification data organized by category

Example data structure:
```js
{
  events: [
    {
      id: String,
      title: String,
      category: String,
      description: String,
      date: String,
      isRead: Boolean,
      icon: String
    }
  ],
  jobs: [...],
  messages: [...]
}
```

---

## 🔧 Integrating with API

To connect with a real backend:

```jsx
// In Notification.js
useEffect(() => {
  const fetchNotifications = async () => {
    try {
      const response = await fetch('/api/notifications');
      const data = await response.json();
      setUnreadNotifications({
        events: data.events || [],
        jobs: data.jobs || [],
        messages: data.messages || []
      });
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  fetchNotifications();
}, []);
```

Mark as read API call:
```jsx
const handleMarkAsRead = async () => {
  try {
    await fetch('/api/notifications/mark-read', {
      method: 'POST'
    });
    // Update local state after successful API call
    // ...
  } catch (error) {
    console.error('Error marking as read:', error);
  }
};
```

---

## 📱 Responsive Breakpoints

- **Desktop (768px+):** Full layout with navigation menu and profile section
- **Tablet (480px - 768px):** Optimized spacing, hidden menu
- **Mobile (<480px):** Compact layout, adjusted fonts and spacing

---

## ♿ Accessibility Features

- ✅ Semantic HTML elements
- ✅ ARIA labels on buttons (`aria-label`)
- ✅ Keyboard navigation support
- ✅ High contrast colors for readability
- ✅ Focus states on interactive elements

---

## 🚀 Performance Optimization

The component uses:

1. **useMemo** - Filters notifications only when dependencies change
2. **Compound Components** - No unnecessary re-renders
3. **CSS Animations** - Hardware-accelerated transitions
4. **Lazy Loading** - Ready for React.lazy() implementation

---

## 🐛 Troubleshooting

### Search Not Working
- Ensure `searchTerm` state is properly updated
- Check that notification objects have required fields (title, description, sender)

### Styles Not Applied
- Verify `Notification.css` is imported in the main component
- Check FontAwesome icons are loaded in your HTML

### Unread Badge Not Showing
- Confirm `unreadCount` prop is passed to `NotificationHeader`
- Check `isRead` property in notification objects

---

## 📚 Browser Support

- Chrome/Edge: ✅ Full support
- Firefox: ✅ Full support
- Safari: ✅ Full support
- IE 11: ⚠️ Limited support (no CSS Grid features)

---

## 🎬 Quick Start

1. Import components:
```jsx
import Notification from './pages/Home/Notification';
```

2. Add route in your router:
```jsx
<Route path="/notifications" element={<Notification />} />
```

3. Customize data in the component state

4. Style with CSS variables as needed

---

## 📝 License

Part of Alumni Connect Platform - Use as needed within your application.

---

## 🤝 Contributing

To extend these components:

1. Create new card types following the pattern
2. Add new reusable sections for different notification types
3. Update CSS variables for consistent theming
4. Test on multiple screen sizes

---

**Happy coding! 🚀**
