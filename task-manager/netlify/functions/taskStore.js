let nanoid;

const createFallbackNanoid = () => {
  const crypto = require("crypto");
  return (size = 21) => {
    let id = "";
    while (id.length < size) {
      id += crypto
        .randomBytes(size)
        .toString("base64")
        .replace(/[^a-zA-Z0-9]/g, "");
    }
    return id.slice(0, size);
  };
};

const useFallback = (reason) => {
  nanoid = createFallbackNanoid();
  if (reason) {
    console.warn("Using crypto fallback for nanoid", reason);
  }
};

const loadNanoid = () => {
  try {
    ({ nanoid } = require("nanoid/non-secure"));
    return;
  } catch (nonSecureError) {
    console.warn(
      "nanoid/non-secure import failed, trying ESM build",
      nonSecureError
    );
  }

  try {
    ({ nanoid } = require("nanoid"));
  } catch (error) {
    useFallback(error);
  }
};

if (process.env.NETLIFY) {
  useFallback(new Error("Netlify runtime does not support require('nanoid')"));
} else {
  loadNanoid();
  if (typeof nanoid !== "function") {
    useFallback(new Error("nanoid package unavailable"));
  }
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
