import { randomBytes } from "crypto";
import { connectLambda, getStore } from "@netlify/blobs";

const STORE_NAME = "task-bud-store";
const STORE_KEY = "task-list";
const REMOTE_BASE_URL =
  process.env.REMOTE_TASKS_API ||
  "https://task-management-server-nyfr.onrender.com/api/tasks";

const createFallbackNanoid =
  () =>
  (size = 21) => {
    let id = "";
    while (id.length < size) {
      id += randomBytes(size)
        .toString("base64")
        .replace(/[^a-zA-Z0-9]/g, "");
    }
    return id.slice(0, size);
  };

const fallbackNanoid = createFallbackNanoid();
let nanoid = fallbackNanoid;

const loadNanoid = async () => {
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

  try {
    const module = await import("nanoid");
    if (typeof module.nanoid === "function") {
      return module.nanoid;
    }
  } catch (error) {
    console.warn("Unable to import nanoid module, using fallback", error);
  }

  return fallbackNanoid;
};

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

const FALLBACK_GLOBAL_KEY = "__taskBudFallbackStore__";

const ensureFallbackContainer = () => {
  if (!globalThis[FALLBACK_GLOBAL_KEY]) {
    globalThis[FALLBACK_GLOBAL_KEY] = {
      tasks: buildDefaultTasks(),
    };
  }
  return globalThis[FALLBACK_GLOBAL_KEY];
};

let store;
let connectAttempted = false;
let storageMode = "uninitialized"; // "blob" | "remote" | "memory"

const useRemoteStorage = () => {
  if (!REMOTE_BASE_URL) {
    return false;
  }
  storageMode = "remote";
  return true;
};

export const initializeStore = async (event) => {
  if (store) {
    return;
  }

  if (!process.env.NETLIFY) {
    if (!useRemoteStorage()) {
      storageMode = "memory";
      ensureFallbackContainer();
    }
    return;
  }

  try {
    if (!connectAttempted) {
      try {
        console.log("initializeStore: event keys", {
          hasBlobs: Boolean(event?.blobs),
          eventKeys: event ? Object.keys(event) : [],
        });
        if (event?.blobs) {
          connectLambda(event);
        }
      } catch (connectError) {
        console.warn("connectLambda failed", connectError);
      }
      connectAttempted = true;
    }

    store = getStore(STORE_NAME);
    console.log("initializeStore: store ready", {
      hasSetJSON: typeof store.setJSON === "function",
      hasGet: typeof store.get === "function",
    });
    const existing = await store.get(STORE_KEY, { type: "json" });
    if (!Array.isArray(existing)) {
      const seeded = buildDefaultTasks();
      await store.setJSON(STORE_KEY, seeded);
    }
    storageMode = "blob";
  } catch (error) {
    store = undefined;
    if (!useRemoteStorage()) {
      storageMode = "memory";
      ensureFallbackContainer();
    }
    console.warn(
      "Netlify Blob store unavailable, using in-memory storage instead",
      error
    );
  }
};

const remoteRequest = async (path = "", init = {}) => {
  if (!REMOTE_BASE_URL) {
    throw new Error("REMOTE_TASKS_API not configured");
  }

  const url = `${REMOTE_BASE_URL}${path}`;
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

  if (response.status === 204) {
    return null;
  }

  return response.json();
};

const readTasks = async () => {
  if (storageMode === "remote") {
    const data = await remoteRequest();
    if (data && Array.isArray(data.taskList)) {
      return data.taskList;
    }
    return [];
  }

  if (storageMode === "memory" || !store) {
    const container = ensureFallbackContainer();
    return [...container.tasks];
  }

  const storedTasks = await store.get(STORE_KEY, { type: "json" });
  if (Array.isArray(storedTasks)) {
    return storedTasks;
  }

  const seeded = buildDefaultTasks();
  await store.setJSON(STORE_KEY, seeded);
  return seeded;
};

const writeTasks = async (tasks) => {
  if (storageMode === "remote") {
    await remoteRequest("", {
      method: "PUT",
      body: JSON.stringify({ taskList: tasks }),
    });
    return;
  }

  if (storageMode === "memory" || !store) {
    const container = ensureFallbackContainer();
    container.tasks = tasks;
    return;
  }

  await store.setJSON(STORE_KEY, tasks);
};

export const getTasks = async () => {
  const tasks = await readTasks();
  return tasks;
};

export const createTask = async (title) => {
  const tasks = await readTasks();
  const newTask = {
    id: nanoid(),
    title,
    isDone: false,
  };

  if (storageMode === "remote") {
    const data = await remoteRequest("", {
      method: "POST",
      body: JSON.stringify({ title }),
    });
    if (data?.task) {
      return data.task;
    }
    // If remote request did not return a task, fall back to local logic
  }

  const updated = [...tasks, newTask];
  await writeTasks(updated);
  return newTask;
};

export const updateTask = async (taskId, isDone) => {
  const tasks = await readTasks();
  console.log("updateTask read", {
    count: tasks.length,
    taskId,
    storageMode,
    hasStore: Boolean(store),
  });

  if (storageMode === "remote") {
    await remoteRequest(`/${taskId}`, {
      method: "PATCH",
      body: JSON.stringify({ isDone }),
    });
    return true;
  }

  const updated = tasks.map((task) => {
    if (task.id === taskId) {
      return { ...task, isDone };
    }
    return task;
  });
  await writeTasks(updated);
  console.log("updateTask wrote", {
    storageMode,
    hasStore: Boolean(store),
  });
  return true;
};

export const removeTask = async (taskId) => {
  if (storageMode === "remote") {
    await remoteRequest(`/${taskId}`, { method: "DELETE" });
    return true;
  }

  const tasks = await readTasks();
  const updated = tasks.filter((task) => task.id !== taskId);
  await writeTasks(updated);
  return true;
};
