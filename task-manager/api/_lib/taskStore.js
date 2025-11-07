import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { nanoid } from "nanoid";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataFilePath = path.join(__dirname, "..", "tasks.data.json");

let taskCache;
let isPersistWritable = true;

const loadTasksFromDisk = async () => {
  try {
    const fileContents = await fs.readFile(dataFilePath, "utf8");
    const parsed = JSON.parse(fileContents);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return [];
  } catch (error) {
    return [];
  }
};

const ensureTasksLoaded = async () => {
  if (!taskCache) {
    taskCache = await loadTasksFromDisk();
  }
  return taskCache;
};

const persistTasks = async (tasks) => {
  taskCache = tasks;
  if (!isPersistWritable) {
    return;
  }

  try {
    await fs.writeFile(dataFilePath, JSON.stringify(tasks, null, 2), "utf8");
  } catch (error) {
    isPersistWritable = false;
  }
};

export const getTasks = async () => {
  const tasks = await ensureTasksLoaded();
  return tasks;
};

export const createTask = async (title) => {
  const tasks = await ensureTasksLoaded();
  const newTask = { id: nanoid(), title, isDone: false };
  const updated = [...tasks, newTask];
  await persistTasks(updated);
  return newTask;
};

export const updateTask = async (taskId, isDone) => {
  const tasks = await ensureTasksLoaded();
  const updated = tasks.map((task) => {
    if (task.id === taskId) {
      return { ...task, isDone };
    }
    return task;
  });
  await persistTasks(updated);
};

export const removeTask = async (taskId) => {
  const tasks = await ensureTasksLoaded();
  const updated = tasks.filter((task) => task.id !== taskId);
  await persistTasks(updated);
};

export const resetTasksCache = () => {
  taskCache = undefined;
};
