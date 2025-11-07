import { randomBytes } from "crypto";
import { connectLambda, getStore } from "@netlify/blobs";

const STORE_NAME = "task-bud-store";
const STORE_KEY = "task-list";

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

let store;
let usingFallbackStore = false;
let fallbackTasks = buildDefaultTasks();
let connectAttempted = false;

export const initializeStore = async (event) => {
  if (store) {
    return;
  }

  if (!process.env.NETLIFY) {
    usingFallbackStore = true;
    return;
  }

  try {
    if (!connectAttempted) {
      try {
        connectLambda(event ?? {});
      } catch (connectError) {
        console.warn("connectLambda failed", connectError);
      }
      connectAttempted = true;
    }

    store = getStore(STORE_NAME);
    const existing = await store.get(STORE_KEY, { type: "json" });
    if (!Array.isArray(existing)) {
      const seeded = buildDefaultTasks();
      await store.setJSON(STORE_KEY, seeded);
    }
    usingFallbackStore = false;
  } catch (error) {
    store = undefined;
    usingFallbackStore = true;
    console.warn(
      "Netlify Blob store unavailable, using in-memory storage instead",
      error
    );
  }
};

const readTasks = async () => {
  if (usingFallbackStore || !store) {
    return [...fallbackTasks];
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
  if (usingFallbackStore || !store) {
    fallbackTasks = tasks;
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
  const updated = [...tasks, newTask];
  await writeTasks(updated);
  return newTask;
};

export const updateTask = async (taskId, isDone) => {
  const tasks = await readTasks();
  const updated = tasks.map((task) => {
    if (task.id === taskId) {
      return { ...task, isDone };
    }
    return task;
  });
  await writeTasks(updated);
  return true;
};

export const removeTask = async (taskId) => {
  const tasks = await readTasks();
  const updated = tasks.filter((task) => task.id !== taskId);
  await writeTasks(updated);
  return true;
};
