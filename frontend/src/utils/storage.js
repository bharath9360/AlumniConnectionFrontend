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

// Memory fallback in case localStorage is blocked
let memoryStorage = {};

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
                // If it exists, we don't merge from JSON anymore to respect deletions
                return;
            }
        }
    };

    ensureData(STORAGE_KEYS.USERS, usersData);
    ensureData(STORAGE_KEYS.FEED, feedData);
    ensureData(STORAGE_KEYS.JOBS, jobsData);
    ensureData(STORAGE_KEYS.EVENTS, eventsData);
    ensureData(STORAGE_KEYS.CHATS, chatsData);
    ensureData(STORAGE_KEYS.NOTIFICATIONS, notificationsData);
    try {
        if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
            localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(usersData));
        }
        if (!localStorage.getItem(STORAGE_KEYS.FEED)) {
            localStorage.setItem(STORAGE_KEYS.FEED, JSON.stringify(feedData));
        }
        if (!localStorage.getItem(STORAGE_KEYS.JOBS)) {
            localStorage.setItem(STORAGE_KEYS.JOBS, JSON.stringify(jobsData));
        }
        if (!localStorage.getItem(STORAGE_KEYS.EVENTS)) {
            localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(eventsData));
        }
        if (!localStorage.getItem(STORAGE_KEYS.CHATS)) {
            localStorage.setItem(STORAGE_KEYS.CHATS, JSON.stringify(chatsData));
        }
    } catch (e) {
        console.warn('LocalStorage access blocked or failed. Using memory storage.', e);
        // Pre-fill memory storage with initial data if localStorage fails
        memoryStorage[STORAGE_KEYS.USERS] = JSON.stringify(usersData);
        memoryStorage[STORAGE_KEYS.FEED] = JSON.stringify(feedData);
        memoryStorage[STORAGE_KEYS.JOBS] = JSON.stringify(jobsData);
        memoryStorage[STORAGE_KEYS.EVENTS] = JSON.stringify(eventsData);
        memoryStorage[STORAGE_KEYS.CHATS] = JSON.stringify(chatsData);
    }
};

const getCollection = (key) => {
    try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : (memoryStorage[key] ? JSON.parse(memoryStorage[key]) : []);
    } catch (e) {
        const data = memoryStorage[key];
        return data ? JSON.parse(data) : [];
    }
};

const saveCollection = (key, data) => {
    try {
        localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
        memoryStorage[key] = JSON.stringify(data);
    }
};

export const storage = {
    init: initializeStorage,

    // Users
    getUsers: () => getCollection(STORAGE_KEYS.USERS),
    getCurrentUser: () => {
        try {
            const data = localStorage.getItem(STORAGE_KEYS.CURRENT_USER) || memoryStorage[STORAGE_KEYS.CURRENT_USER];
            return data ? JSON.parse(data) : null;
        } catch (e) {
            const data = memoryStorage[STORAGE_KEYS.CURRENT_USER];
            return data ? JSON.parse(data) : null;
        }
    },
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
        try {
            localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
        } catch (e) {
            delete memoryStorage[STORAGE_KEYS.CURRENT_USER];
        }
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
    saveChats: (chats) => saveCollection(STORAGE_KEYS.CHATS, chats),
    createChat: (chat) => {
        const chats = getCollection(STORAGE_KEYS.CHATS);
        const updatedChats = [chat, ...chats];
        saveCollection(STORAGE_KEYS.CHATS, updatedChats);
        return updatedChats;
    },

    // Notifications
    getNotifications: () => getCollection(STORAGE_KEYS.NOTIFICATIONS),
    saveNotifications: (notifications) => saveCollection(STORAGE_KEYS.NOTIFICATIONS, notifications)
};
