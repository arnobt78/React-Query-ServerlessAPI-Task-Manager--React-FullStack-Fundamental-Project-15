import { getTasks, createTask } from "../_lib/taskStore.js";

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
  if (req.method === "GET") {
    const taskList = await getTasks();
    sendJson(res, 200, { taskList });
    return;
  }

  if (req.method === "POST") {
    try {
      const body = await parseBody(req);
      const { title } = body;
      if (!title) {
        sendJson(res, 400, { msg: "please provide title" });
        return;
      }
      const task = await createTask(title);
      sendJson(res, 200, { task });
    } catch (error) {
      sendJson(res, 500, { msg: "something went wrong" });
    }
    return;
  }

  res.setHeader("Allow", "GET, POST");
  sendJson(res, 405, { msg: "method not allowed" });
}

export const config = {
  runtime: "nodejs",
};
