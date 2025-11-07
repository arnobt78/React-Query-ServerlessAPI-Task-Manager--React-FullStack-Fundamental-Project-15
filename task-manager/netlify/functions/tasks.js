import {
  createTask,
  getTasks,
  initializeStore,
  removeTask,
  updateTask,
} from "./taskStore.js";

const jsonResponse = (statusCode, body) => ({
  statusCode,
  headers: {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
  },
  body: JSON.stringify(body),
});

const extractTaskId = (event) => {
  if (event.pathParameters && event.pathParameters.splat) {
    const [id] = event.pathParameters.splat.split("/");
    return id;
  }

  if (event.pathParameters && event.pathParameters.id) {
    return event.pathParameters.id;
  }

  const parts = event.path ? event.path.split("/") : [];
  return parts[parts.length - 1] || "";
};

export const handler = async (event) => {
  // Handle preflight CORS requests
  if (event.httpMethod === "OPTIONS") {
    return jsonResponse(200, {});
  }

  await initializeStore(event);

  if (event.httpMethod === "GET") {
    const taskList = await getTasks();
    return jsonResponse(200, { taskList });
  }

  if (event.httpMethod === "POST") {
    try {
      const payload = event.body ? JSON.parse(event.body) : {};
      const { title } = payload;
      if (!title) {
        return jsonResponse(400, { msg: "please provide title" });
      }
      const task = await createTask(title);
      return jsonResponse(200, { task });
    } catch (error) {
      console.error("POST Error:", error);
      return jsonResponse(500, { msg: "something went wrong" });
    }
  }

  const taskId = extractTaskId(event);
  if (!taskId) {
    return jsonResponse(400, { msg: "task id required" });
  }

  if (event.httpMethod === "PATCH") {
    try {
      const payload = event.body ? JSON.parse(event.body) : {};
      const { isDone } = payload;
      if (typeof isDone !== "boolean") {
        return jsonResponse(400, { msg: "please provide isDone boolean" });
      }

      await updateTask(taskId, isDone);
      return jsonResponse(200, { msg: "task updated" });
    } catch (error) {
      console.error("PATCH Error:", error);
      return jsonResponse(500, { msg: "something went wrong" });
    }
  }

  if (event.httpMethod === "DELETE") {
    try {
      await removeTask(taskId);
      return jsonResponse(200, { msg: "task removed" });
    } catch (error) {
      console.error("DELETE Error:", error);
      return jsonResponse(500, { msg: "something went wrong" });
    }
  }

  return jsonResponse(405, { msg: "method not allowed" });
};
