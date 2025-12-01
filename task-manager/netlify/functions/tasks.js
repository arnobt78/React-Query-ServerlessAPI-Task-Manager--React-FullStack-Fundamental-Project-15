// Netlify serverless function handler for task management
// This single function handles all HTTP methods (GET, POST, PATCH, DELETE) for the /api/tasks endpoint
// All methods share the same in-memory store, ensuring consistent state across operations
import {
  createTask,
  getTasks,
  initializeStore,
  removeTask,
  updateTask,
} from "./taskStore.js";

// Helper function to create standardized JSON responses for Netlify functions
// Includes CORS headers to allow requests from any origin (needed for browser-based frontend)
const jsonResponse = (statusCode, body) => ({
  statusCode,
  headers: {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*", // Allow requests from any domain
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
  },
  body: JSON.stringify(body),
});

// Extract task ID from the request path/event
// Handles multiple path parameter formats (splat, id, or path parsing)
// Used for PATCH and DELETE requests where taskId is in the URL
const extractTaskId = (event) => {
  // Check for Netlify's splat parameter (used in redirect rules like /api/tasks/*)
  if (event.pathParameters && event.pathParameters.splat) {
    const [id] = event.pathParameters.splat.split("/");
    return id;
  }

  // Check for standard id parameter
  if (event.pathParameters && event.pathParameters.id) {
    return event.pathParameters.id;
  }

  // Fallback: extract from path string (last segment after splitting by "/")
  const parts = event.path ? event.path.split("/") : [];
  return parts[parts.length - 1] || "";
};

// Main Netlify function handler - entry point for all /api/tasks requests
// This is the exported function that Netlify invokes when the endpoint is hit
export const handler = async (event) => {
  // Handle preflight CORS requests (OPTIONS method)
  // Browsers send this automatically before actual requests to check CORS permissions
  if (event.httpMethod === "OPTIONS") {
    return jsonResponse(200, {});
  }

  // Initialize the task store before handling any requests
  // This sets up in-memory storage, Netlify Blobs, or remote API based on environment
  await initializeStore(event);

  // GET: Fetch all tasks
  if (event.httpMethod === "GET") {
    const taskList = await getTasks();
    return jsonResponse(200, { taskList });
  }

  // POST: Create a new task
  if (event.httpMethod === "POST") {
    try {
      // Parse JSON body from request
      const payload = event.body ? JSON.parse(event.body) : {};
      const { title } = payload;
      // Validate that title is provided
      if (!title) {
        return jsonResponse(400, { msg: "please provide title" });
      }
      // Create task and return the created task object
      const task = await createTask(title);
      return jsonResponse(200, { task });
    } catch (error) {
      console.error("POST Error:", error);
      return jsonResponse(500, { msg: "something went wrong" });
    }
  }

  // For PATCH and DELETE, we need to extract taskId from the URL path
  const taskId = extractTaskId(event);
  if (!taskId) {
    return jsonResponse(400, { msg: "task id required" });
  }

  // PATCH: Update task completion status (toggle isDone)
  if (event.httpMethod === "PATCH") {
    try {
      // Parse JSON body containing the isDone boolean
      const payload = event.body ? JSON.parse(event.body) : {};
      const { isDone } = payload;
      // Validate that isDone is a boolean
      if (typeof isDone !== "boolean") {
        return jsonResponse(400, { msg: "please provide isDone boolean" });
      }

      // Update the task in the store
      await updateTask(taskId, isDone);
      return jsonResponse(200, { msg: "task updated" });
    } catch (error) {
      console.error("PATCH Error:", error);
      return jsonResponse(500, { msg: "something went wrong" });
    }
  }

  // DELETE: Remove a task by ID
  if (event.httpMethod === "DELETE") {
    try {
      await removeTask(taskId);
      return jsonResponse(200, { msg: "task removed" });
    } catch (error) {
      console.error("DELETE Error:", error);
      return jsonResponse(500, { msg: "something went wrong" });
    }
  }

  // Return 405 for unsupported HTTP methods
  return jsonResponse(405, { msg: "method not allowed" });
};
