// localStorage utility functions for persisting tasks in the browser
// This provides offline-like functionality - tasks persist across page refreshes

const STORAGE_KEY = "react-query-task-manager";

// Check if code is running in a browser environment with localStorage support
// Important for SSR (Server-Side Rendering) compatibility
const isBrowser = () => typeof window !== "undefined" && !!window.localStorage;

// Read tasks from browser's localStorage
// Returns undefined if no data exists, not a browser environment, or data is invalid
// Used to hydrate React Query's cache on app initialization for instant UI display
export const readTasksFromStorage = () => {
  // Safety check: only run in browser environment
  if (!isBrowser()) {
    return undefined;
  }
  try {
    // Retrieve the stored JSON string from localStorage
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return undefined;
    }
    // Parse the JSON string back into JavaScript array
    const parsed = JSON.parse(raw);
    // Validate that parsed data is an array (safety check)
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return undefined;
  } catch (error) {
    // If parsing fails (corrupted data), return undefined instead of crashing
    return undefined;
  }
};

// Write tasks to browser's localStorage
// Called after successful API responses to keep localStorage in sync with server data
// This ensures tasks persist even if the server resets (like in serverless cold starts)
export const writeTasksToStorage = (taskList) => {
  // Safety check: only run in browser environment
  if (!isBrowser()) {
    return;
  }
  try {
    // Convert task array to JSON string and store in localStorage
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(taskList));
  } catch (error) {
    // ignore write errors (e.g., quota exceeded, private browsing mode)
  }
};

// Remove all tasks from localStorage
// Useful for clearing cached data or implementing a "clear all" feature
export const removeTasksFromStorage = () => {
  // Safety check: only run in browser environment
  if (!isBrowser()) {
    return;
  }
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    // ignore remove errors
  }
};
