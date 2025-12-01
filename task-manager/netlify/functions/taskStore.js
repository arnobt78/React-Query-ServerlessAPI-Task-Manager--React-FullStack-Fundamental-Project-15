// Task store module - handles all task data persistence
// Supports multiple storage backends: Netlify Blobs (persistent), in-memory (fallback), or remote API
import { randomBytes } from "crypto";
import { connectLambda, getStore } from "@netlify/blobs";

// Configuration constants for storage
const STORE_NAME = "task-bud-store"; // Name of the Netlify Blob store
const STORE_KEY = "task-list"; // Key used to store tasks in the blob store
const REMOTE_BASE_URL = process.env.REMOTE_TASKS_API || ""; // Optional remote API endpoint

// Fallback ID generator using Node.js crypto module
// Used when nanoid package is unavailable (common in Netlify's serverless environment)
// Creates URL-safe random IDs similar to nanoid functionality
const createFallbackNanoid =
  () =>
  (size = 21) => {
    let id = "";
    // Generate random bytes, convert to base64, filter to alphanumeric only
    while (id.length < size) {
      id += randomBytes(size)
        .toString("base64")
        .replace(/[^a-zA-Z0-9]/g, ""); // Remove special characters, keep only letters and numbers
    }
    return id.slice(0, size);
  };

const fallbackNanoid = createFallbackNanoid();
let nanoid = fallbackNanoid; // Default to fallback, will try to load nanoid package if available

// Attempt to load nanoid package for ID generation
// Tries multiple import paths with fallback to crypto-based ID generator
const loadNanoid = async () => {
  // Try importing non-secure version first (CommonJS compatible)
  try {
    const module = await import("nanoid/non-secure");
    if (typeof module.nanoid === "function") {
      return module.nanoid;
    }
  } catch (nonSecureError) {
    console.warn(
      "nanoid/non-secure import failed, trying nanoid default export",
      nonSecureError
    );
  }

  // Fallback: try importing default nanoid package
  try {
    const module = await import("nanoid");
    if (typeof module.nanoid === "function") {
      return module.nanoid;
    }
  } catch (error) {
    console.warn("Unable to import nanoid module, using fallback", error);
  }

  // If all imports fail, return the crypto-based fallback generator
  return fallbackNanoid;
};

// Load nanoid asynchronously only when NOT running on Netlify
// Netlify functions bundle CommonJS, so dynamic imports often fail - use fallback instead
if (!process.env.NETLIFY) {
  loadNanoid()
    .then((fn) => {
      nanoid = fn;
    })
    .catch((error) => {
      console.warn("Unable to set nanoid from async import", error);
      nanoid = fallbackNanoid;
    });
}

// Build default/seed tasks for initial app state
// These tasks appear when the store is first initialized or after a cold start
const buildDefaultTasks = () => [
  {
    id: nanoid(),
    title: "walk the dog",
    isDone: false,
  },
  {
    id: nanoid(),
    title: "wash dishes",
    isDone: false,
  },
  {
    id: nanoid(),
    title: "drink coffee",
    isDone: true,
  },
];

// Global key for storing fallback in-memory task container
// Using globalThis ensures the same store is shared across all function invocations in the same container
const FALLBACK_GLOBAL_KEY = "__taskBudFallbackStore__";

// Ensure a global fallback container exists for in-memory storage
// This allows multiple function instances to share the same in-memory task list
// Important: Only persists during the lifetime of the serverless container (lost on cold start)
const ensureFallbackContainer = () => {
  if (!globalThis[FALLBACK_GLOBAL_KEY]) {
    globalThis[FALLBACK_GLOBAL_KEY] = {
      tasks: buildDefaultTasks(),
    };
  }
  return globalThis[FALLBACK_GLOBAL_KEY];
};

// Storage state variables
let store; // Netlify Blob store instance (if available)
let connectAttempted = false; // Flag to prevent multiple connection attempts
let storageMode = "uninitialized"; // Current storage mode: "blob" | "remote" | "memory"

// Check if remote storage should be used (if REMOTE_TASKS_API env var is set)
const useRemoteStorage = () => {
  if (!REMOTE_BASE_URL) {
    return false;
  }
  storageMode = "remote";
  return true;
};

// Switch to in-memory storage mode (fallback when other storage methods fail)
const switchToMemoryStorage = (reason) => {
  storageMode = "memory";
  ensureFallbackContainer(); // Initialize global container if needed
  if (reason) {
    console.warn("Falling back to in-memory storage", reason);
  }
};

// Initialize the storage backend based on environment
// Tries Netlify Blobs first, falls back to remote API, then to in-memory storage
// This function is called once per function invocation to ensure storage is ready
export const initializeStore = async (event) => {
  // If store is already initialized, skip initialization
  if (store) {
    return;
  }

  // If not running on Netlify, use remote API or in-memory storage
  if (!process.env.NETLIFY) {
    if (!useRemoteStorage()) {
      switchToMemoryStorage();
    }
    return;
  }

  // Try to initialize Netlify Blobs storage (persistent storage option)
  try {
    // Connect to Netlify Blobs API (only attempt once)
    if (!connectAttempted) {
      try {
        console.log("initializeStore: event keys", {
          hasBlobs: Boolean(event?.blobs),
          eventKeys: event ? Object.keys(event) : [],
        });
        // Connect Lambda to Netlify Blobs if event contains blob context
        if (event?.blobs) {
          connectLambda(event);
        }
      } catch (connectError) {
        console.warn("connectLambda failed", connectError);
      }
      connectAttempted = true;
    }

    // Get reference to the blob store
    store = getStore(STORE_NAME);
    console.log("initializeStore: store ready", {
      hasSetJSON: typeof store.setJSON === "function",
      hasGet: typeof store.get === "function",
    });
    // Check if store already has tasks, if not, seed with default tasks
    const existing = await store.get(STORE_KEY, { type: "json" });
    if (!Array.isArray(existing)) {
      const seeded = buildDefaultTasks();
      await store.setJSON(STORE_KEY, seeded);
    }
    storageMode = "blob"; // Successfully initialized blob storage
  } catch (error) {
    // Blob storage failed, fall back to alternative storage methods
    store = undefined;
    if (!useRemoteStorage()) {
      switchToMemoryStorage(error);
    }
    console.warn(
      "Netlify Blob store unavailable, using in-memory storage instead",
      error
    );
  }
};

// Make HTTP request to remote API (if REMOTE_TASKS_API is configured)
// Used as a fallback storage method when Netlify Blobs is unavailable
const remoteRequest = async (path = "", init = {}) => {
  if (!REMOTE_BASE_URL) {
    throw new Error("REMOTE_TASKS_API not configured");
  }

  const url = `${REMOTE_BASE_URL}${path}`;
  try {
    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        ...(init.headers || {}),
      },
      ...init,
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Remote request failed: ${response.status} ${text}`);
    }

    // Handle 204 No Content responses (common for DELETE operations)
    if (response.status === 204) {
      return null;
    }

    return response.json();
  } catch (error) {
    console.error("Remote request error", { url, init, error });
    throw error;
  }
};

// Read tasks from the appropriate storage backend
// Automatically selects storage method based on current storageMode
const readTasks = async () => {
  // Remote storage: fetch from external API
  if (storageMode === "remote") {
    try {
      const data = await remoteRequest();
      if (data && Array.isArray(data.taskList)) {
        return data.taskList;
      }
      return [];
    } catch (error) {
      // If remote request fails, fall back to in-memory storage
      switchToMemoryStorage(error);
    }
  }

  // In-memory storage: read from global container
  if (storageMode === "memory" || !store) {
    const container = ensureFallbackContainer();
    return [...container.tasks]; // Return copy to prevent direct mutations
  }

  // Blob storage: read from Netlify Blobs
  const storedTasks = await store.get(STORE_KEY, { type: "json" });
  if (Array.isArray(storedTasks)) {
    return storedTasks;
  }

  // If blob store is empty, seed it with default tasks
  const seeded = buildDefaultTasks();
  await store.setJSON(STORE_KEY, seeded);
  return seeded;
};

// Write tasks to the appropriate storage backend
// Automatically selects storage method based on current storageMode
const writeTasks = async (tasks) => {
  // Remote storage: send PUT request to external API
  if (storageMode === "remote") {
    try {
      await remoteRequest("", {
        method: "PUT",
        body: JSON.stringify({ taskList: tasks }),
      });
      return;
    } catch (error) {
      // If remote request fails, fall back to in-memory storage
      switchToMemoryStorage(error);
    }
  }

  // In-memory storage: update global container
  if (storageMode === "memory" || !store) {
    const container = ensureFallbackContainer();
    container.tasks = tasks;
    return;
  }

  // Blob storage: save to Netlify Blobs
  await store.setJSON(STORE_KEY, tasks);
};

// ============================================
// EXPORTED CRUD FUNCTIONS
// These functions are used by the serverless function handler
// ============================================

// GET: Retrieve all tasks
// Delegates to readTasks() which handles storage mode selection automatically
export const getTasks = async () => {
  const tasks = await readTasks();
  return tasks;
};

// POST: Create a new task
// Generates a unique ID and adds the task to the store
export const createTask = async (title) => {
  // Read existing tasks first
  const tasks = await readTasks();
  // Create new task object with generated ID
  const newTask = {
    id: nanoid(), // Generate unique identifier
    title,
    isDone: false, // New tasks start as incomplete
  };

  // If using remote storage, try to create via API first
  if (storageMode === "remote") {
    try {
      const data = await remoteRequest("", {
        method: "POST",
        body: JSON.stringify({ title }),
      });
      // If API returns the created task, use it (may have server-generated ID)
      if (data?.task) {
        return data.task;
      }
    } catch (error) {
      // Fall back to in-memory if remote request fails
      switchToMemoryStorage(error);
    }
    // If remote request did not return a task, fall back to local logic
  }

  // Add new task to existing tasks array (maintains immutability)
  const updated = [...tasks, newTask];
  // Write updated list back to storage
  await writeTasks(updated);
  return newTask;
};

// PATCH: Update task completion status (toggle isDone)
// Finds the task by ID and updates its completion status
export const updateTask = async (taskId, isDone) => {
  const tasks = await readTasks();
  console.log("updateTask read", {
    count: tasks.length,
    taskId,
    storageMode,
    hasStore: Boolean(store),
  });

  // If using remote storage, try to update via API first
  if (storageMode === "remote") {
    try {
      await remoteRequest(`/${taskId}`, {
        method: "PATCH",
        body: JSON.stringify({ isDone }),
      });
      return true;
    } catch (error) {
      // Fall back to in-memory if remote request fails
      switchToMemoryStorage(error);
    }
  }

  // Map through tasks and update the matching one
  // Uses map() to maintain immutability (create new array instead of mutating)
  const updated = tasks.map((task) => {
    if (task.id === taskId) {
      return { ...task, isDone }; // Update isDone property
    }
    return task; // Keep other tasks unchanged
  });
  // Write updated list back to storage
  await writeTasks(updated);
  console.log("updateTask wrote", {
    storageMode,
    hasStore: Boolean(store),
  });
  return true;
};

// DELETE: Remove a task by ID
// Filters out the task with matching ID from the list
export const removeTask = async (taskId) => {
  // If using remote storage, try to delete via API first
  if (storageMode === "remote") {
    try {
      await remoteRequest(`/${taskId}`, { method: "DELETE" });
      return true;
    } catch (error) {
      // Fall back to in-memory if remote request fails
      switchToMemoryStorage(error);
    }
  }

  // Read current tasks
  const tasks = await readTasks();
  // Filter out the task with matching ID (creates new array without that task)
  const updated = tasks.filter((task) => task.id !== taskId);
  // Write updated list back to storage
  await writeTasks(updated);
  return true;
};
