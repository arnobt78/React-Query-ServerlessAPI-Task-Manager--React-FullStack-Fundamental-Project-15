import { updateTask, removeTask } from "../_lib/taskStore.js";

const sendJson = (res, statusCode, payload) => {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(payload));
};

const parseBody = async (req) => {
  if (req.body) {
    return req.body;
  }

  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
    });
    req.on("end", () => {
      if (!body) {
        resolve({});
        return;
      }
      try {
        const parsed = JSON.parse(body);
        resolve(parsed);
      } catch (error) {
        reject(error);
      }
    });
    req.on("error", (error) => reject(error));
  });
};

export default async function handler(req, res) {
  const requestUrl = new URL(req.url, `http://${req.headers.host}`);
  const idFromQuery = req.query && req.query.id;
  const idFromPath = requestUrl.pathname.split("/").pop();
  const taskId = idFromQuery || idFromPath;

  if (!taskId) {
    sendJson(res, 400, { msg: "task id required" });
    return;
  }

  if (req.method === "PATCH") {
    try {
      const body = await parseBody(req);
      const { isDone } = body;
      if (typeof isDone !== "boolean") {
        sendJson(res, 400, { msg: "please provide isDone boolean" });
        return;
      }
      await updateTask(taskId, isDone);
      sendJson(res, 200, { msg: "task updated" });
    } catch (error) {
      sendJson(res, 500, { msg: "something went wrong" });
    }
    return;
  }

  if (req.method === "DELETE") {
    try {
      await removeTask(taskId);
      sendJson(res, 200, { msg: "task removed" });
    } catch (error) {
      sendJson(res, 500, { msg: "something went wrong" });
    }
    return;
  }

  res.setHeader("Allow", "PATCH, DELETE");
  sendJson(res, 405, { msg: "method not allowed" });
}

export const config = {
  runtime: "nodejs",
};
