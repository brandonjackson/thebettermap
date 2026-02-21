import { getCollection, setCollection, getItem, setItem } from './storage.js';

const USERS_KEY = 'users';
const SESSION_KEY = 'session';

export function register({ email, displayName, password }) {
  const users = getCollection(USERS_KEY);

  if (users.find((u) => u.email === email)) {
    throw new Error('An account with this email already exists.');
  }

  const user = {
    id: crypto.randomUUID(),
    email,
    displayName,
    password, // localStorage only — a real backend would hash this
    role: users.length === 0 ? 'admin' : 'user', // first user becomes admin
    createdAt: new Date().toISOString(),
  };

  users.push(user);
  setCollection(USERS_KEY, users);
  setItem(SESSION_KEY, user.id);

  return sanitize(user);
}

export function login({ email, password }) {
  const users = getCollection(USERS_KEY);
  const user = users.find((u) => u.email === email && u.password === password);

  if (!user) {
    throw new Error('Invalid email or password.');
  }

  setItem(SESSION_KEY, user.id);
  return sanitize(user);
}

export function logout() {
  setItem(SESSION_KEY, null);
}

export function getCurrentUser() {
  const userId = getItem(SESSION_KEY);
  if (!userId) return null;

  const users = getCollection(USERS_KEY);
  const user = users.find((u) => u.id === userId);
  return user ? sanitize(user) : null;
}

export function getUserById(id) {
  const users = getCollection(USERS_KEY);
  const user = users.find((u) => u.id === id);
  return user ? sanitize(user) : null;
}

export function getAllUsers() {
  return getCollection(USERS_KEY).map(sanitize);
}

export function updateUserRole(userId, role) {
  const users = getCollection(USERS_KEY);
  const idx = users.findIndex((u) => u.id === userId);
  if (idx === -1) return null;
  users[idx].role = role;
  setCollection(USERS_KEY, users);
  return sanitize(users[idx]);
}

export function deleteUser(userId) {
  const users = getCollection(USERS_KEY).filter((u) => u.id !== userId);
  setCollection(USERS_KEY, users);
}

function sanitize(user) {
  const { password, ...safe } = user;
  return safe;
}
