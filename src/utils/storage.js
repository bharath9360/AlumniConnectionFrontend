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

const STORAGE_KEYS = {
    USERS: 'alumni_users',
    FEED: 'alumni_feed',
    JOBS: 'alumni_jobs',
    EVENTS: 'alumni_events',
    CHATS: 'alumni_chats',
    CURRENT_USER: 'alumni_current_user'
};

const initializeStorage = () => {
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
    // Do not auto-login during initialization
    // The user must log in through the login page
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
    }
};
