/**
 * storage.js
 * Utility for "Backend-Ready" CRUD operations using LocalStorage.
 * Initial data is loaded from the /src/data folder.
 */

import usersData from '../data/users.json';
import feedData from '../data/feed.json';
import jobsData from '../data/jobs.json';
import eventsData from '../data/events.json';
import chatsData from '../data/chats.json';
import notificationsData from '../data/notifications.json';

const STORAGE_KEYS = {
    USERS: 'alumni_users',
    FEED: 'alumni_feed',
    JOBS: 'alumni_jobs',
    EVENTS: 'alumni_events',
    CHATS: 'alumni_chats',
    NOTIFICATIONS: 'alumni_notifications',
    CURRENT_USER: 'alumni_current_user'
};

const initializeStorage = () => {
    const ensureData = (key, initialData) => {
        const existing = localStorage.getItem(key);
        if (!existing) {
            localStorage.setItem(key, JSON.stringify(initialData));
        } else {
            // Optional: Merge logic if needed. For now, let's just make sure we have the latest
            // However, merging might overwrite user changes.
            // For chats, we definitely want to ensure new chats from the JSON are added.
            if (key === STORAGE_KEYS.CHATS) {
                const existingChats = JSON.parse(existing);
                const initialChats = initialData;
                const mergedChats = [...existingChats];

                initialChats.forEach(chat => {
                    if (!mergedChats.find(c => c.id === chat.id)) {
                        mergedChats.push(chat);
                    }
                });

                localStorage.setItem(key, JSON.stringify(mergedChats));
            }
        }
    };

    ensureData(STORAGE_KEYS.USERS, usersData);
    ensureData(STORAGE_KEYS.FEED, feedData);
    ensureData(STORAGE_KEYS.JOBS, jobsData);
    ensureData(STORAGE_KEYS.EVENTS, eventsData);
    ensureData(STORAGE_KEYS.CHATS, chatsData);
    ensureData(STORAGE_KEYS.NOTIFICATIONS, notificationsData);
};

const getCollection = (key) => {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
};

const saveCollection = (key, data) => {
    localStorage.setItem(key, JSON.stringify(data));
};

export const storage = {
    init: initializeStorage,

    // Users
    getUsers: () => getCollection(STORAGE_KEYS.USERS),
    getCurrentUser: () => getCollection(STORAGE_KEYS.CURRENT_USER),
    updateCurrentUser: (userData) => {
        saveCollection(STORAGE_KEYS.CURRENT_USER, userData);
        // Also update in users collection
        const users = getCollection(STORAGE_KEYS.USERS);
        const index = users.findIndex(u => u.id === userData.id);
        if (index !== -1) {
            users[index] = userData;
            saveCollection(STORAGE_KEYS.USERS, users);
        }
    },

    logout: () => {
        localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    },

    // Feed
    getFeed: () => getCollection(STORAGE_KEYS.FEED),
    saveFeed: (feed) => saveCollection(STORAGE_KEYS.FEED, feed),
    addPost: (post) => {
        const feed = getCollection(STORAGE_KEYS.FEED);
        const newFeed = [post, ...feed];
        saveCollection(STORAGE_KEYS.FEED, newFeed);
        return newFeed;
    },

    // Jobs
    getJobs: () => getCollection(STORAGE_KEYS.JOBS),
    saveJobs: (jobs) => saveCollection(STORAGE_KEYS.JOBS, jobs),

    // Events
    getEvents: () => getCollection(STORAGE_KEYS.EVENTS),
    saveEvents: (events) => saveCollection(STORAGE_KEYS.EVENTS, events),

    // Chats
    getChats: () => getCollection(STORAGE_KEYS.CHATS),
    saveChat: (chatId, messages) => {
        const chats = getCollection(STORAGE_KEYS.CHATS);
        const index = chats.findIndex(c => c.id === chatId);
        if (index !== -1) {
            chats[index].messages = messages;
            saveCollection(STORAGE_KEYS.CHATS, chats);
        }
    },
    clearConversation: (chatId) => {
        const chats = getCollection(STORAGE_KEYS.CHATS);
        const index = chats.findIndex(c => c.id === chatId);
        if (index !== -1) {
            chats[index].messages = [];
            saveCollection(STORAGE_KEYS.CHATS, chats);
        }
    },
    deleteConversation: (chatId) => {
        const chats = getCollection(STORAGE_KEYS.CHATS);
        const updatedChats = chats.filter(c => c.id !== chatId);
        saveCollection(STORAGE_KEYS.CHATS, updatedChats);
    },

    // Notifications
    getNotifications: () => getCollection(STORAGE_KEYS.NOTIFICATIONS),
    saveNotifications: (notifications) => saveCollection(STORAGE_KEYS.NOTIFICATIONS, notifications)
};
