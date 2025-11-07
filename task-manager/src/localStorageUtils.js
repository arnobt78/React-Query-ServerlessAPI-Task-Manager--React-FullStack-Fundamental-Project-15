const STORAGE_KEY = "react-query-task-manager";

const isBrowser = () => typeof window !== "undefined" && !!window.localStorage;

export const readTasksFromStorage = () => {
  if (!isBrowser()) {
    return undefined;
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return undefined;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return undefined;
  } catch (error) {
    return undefined;
  }
};

export const writeTasksToStorage = (taskList) => {
  if (!isBrowser()) {
    return;
  }
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(taskList));
  } catch (error) {
    // ignore write errors
  }
};

export const removeTasksFromStorage = () => {
  if (!isBrowser()) {
    return;
  }
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    // ignore remove errors
  }
};
