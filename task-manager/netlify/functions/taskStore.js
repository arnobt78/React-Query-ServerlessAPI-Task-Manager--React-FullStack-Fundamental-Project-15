let nanoid;

try {
  ({ nanoid } = require("nanoid"));
} catch (error) {
  const crypto = require("crypto");
  nanoid = (size = 21) => {
    let id = "";
    while (id.length < size) {
      id += crypto
        .randomBytes(size)
        .toString("base64")
        .replace(/[^a-zA-Z0-9]/g, "");
    }
    return id.slice(0, size);
  };
  console.warn("nanoid import failed; using crypto fallback", error);
}

// Shared in-memory storage for demo purposes
// In production, you'd want to use a database
let tasks = [
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

const getTasks = () => {
  return [...tasks];
};

const createTask = (title) => {
  const newTask = {
    id: nanoid(),
    title,
    isDone: false,
  };
  tasks.push(newTask);
  return newTask;
};

const updateTask = (taskId, isDone) => {
  tasks = tasks.map((task) => {
    if (task.id === taskId) {
      return { ...task, isDone };
    }
    return task;
  });
  return true;
};

const removeTask = (taskId) => {
  tasks = tasks.filter((task) => task.id !== taskId);
  return true;
};

module.exports = {
  getTasks,
  createTask,
  updateTask,
  removeTask,
};
