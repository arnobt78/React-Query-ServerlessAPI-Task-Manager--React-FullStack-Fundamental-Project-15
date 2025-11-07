const { nanoid } = require("nanoid");

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
