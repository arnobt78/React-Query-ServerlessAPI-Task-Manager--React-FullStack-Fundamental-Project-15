import { createTask, getTasks, initializeStore } from "./taskStore.js";

const jsonResponse = (statusCode, body) => ({
  statusCode,
  headers: {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  },
  body: JSON.stringify(body),
});

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

  return jsonResponse(405, { msg: "method not allowed" });
};
