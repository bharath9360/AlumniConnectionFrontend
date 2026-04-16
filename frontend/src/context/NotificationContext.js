import React, {
  createContext, useContext, useState,
  useCallback, useEffect, useMemo
} from 'react';
import { useAuth } from './AuthContext';
import { notificationService } from '../services/api';
import { pushPopup } from '../components/common/PopupNotification';

/* ── Context ────────────────────────────────────────────────── */
const NotificationContext = createContext(null);

export const useNotifications = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used inside NotificationProvider');
  return ctx;
};

/* ══════════════════════════════════════════════════════════════
   NotificationProvider
   ─────────────────────────────────────────────────────────────
   Single source of truth for:
     • notifications[]
     • unreadCount  (bell: non-message)
     • unreadMessageCount (chat badge)
     • Real-time socket push (socket is passed in via `socketRef`)
     • CRUD actions: markOneRead, markAllRead, deleteNotif, clearAll
══════════════════════════════════════════════════════════════ */
export const NotificationProvider = ({ children, socketRef }) => {
  const { user } = useAuth();

  /* ── Raw state ──────────────────────────────────────────── */
  const [notifications, setNotifications] = useState([]);
  const [notifLoaded,   setNotifLoaded]   = useState(false);

  /* ── REST fetch ─────────────────────────────────────────── */
  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const res = await notificationService.getNotifications();
      if (res.data?.data) {
        setNotifications(res.data.data);
        setNotifLoaded(true);
      }
    } catch { /* silent */ }
  }, [user]);

  /* ── Bootstrap & polling ────────────────────────────────── */
  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setNotifLoaded(false);
      return;
    }
    fetchNotifications();
    const id = setInterval(fetchNotifications, 60_000);
    return () => clearInterval(id);
  }, [user, fetchNotifications]);

  /* ── Socket listener (socket is wired in by SocketProvider) */
  const addNotification = useCallback((notif) => {
    setNotifications(prev => {
      if (prev.some(n => n._id === notif._id)) return prev; // dedupe
      return [notif, ...prev];
    });
    // ── Trigger WhatsApp-style popup ──
    pushPopup({
      type:  notif.type || 'default',
      title: notif.title || 'New Notification',
      body:  notif.description || notif.message || '',
      pic:   notif.senderPic || notif.pic || '',
      notifId: notif._id,
    });
  }, []);

  /* ── Derived counts ─────────────────────────────────────── */
  const unreadCount = useMemo(
    () => notifications.filter(n => !n.isRead && n.type !== 'message').length,
    [notifications]
  );

  const unreadMessageCount = useMemo(
    () => notifications.filter(n => !n.isRead && n.type === 'message').length,
    [notifications]
  );

  /* ── Actions ────────────────────────────────────────────── */
  const markOneRead = useCallback(async (id) => {
    try {
      await notificationService.markRead(id);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
    } catch { /* silent */ }
  }, []);

  const markAllRead = useCallback(async () => {
    try {
      await notificationService.markAllRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch { /* silent */ }
  }, []);

  const deleteNotif = useCallback(async (id) => {
    try {
      await notificationService.delete(id);
      setNotifications(prev => prev.filter(n => n._id !== id));
    } catch { /* silent */ }
  }, []);

  const clearAll = useCallback(async () => {
    try {
      await notificationService.clearAll();
      setNotifications([]);
    } catch { /* silent */ }
  }, []);

  /* ── Expose ─────────────────────────────────────────────── */
  const value = useMemo(() => ({
    notifications,
    notifLoaded,
    unreadCount,
    unreadMessageCount,
    fetchNotifications,
    addNotification,  // called by SocketProvider on socket push
    markOneRead,
    markAllRead,
    deleteNotif,
    clearAll,
  }), [
    notifications, notifLoaded, unreadCount, unreadMessageCount,
    fetchNotifications, addNotification, markOneRead, markAllRead, deleteNotif, clearAll,
  ]);

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationContext;
