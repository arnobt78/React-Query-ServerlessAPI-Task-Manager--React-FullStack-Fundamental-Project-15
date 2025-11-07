# Task Manager Backend - Node.js & Express.js (Backend Server Side Rendering Reference)

This directory contains the original Express.js backend that powers the Task Manager project. While the deployed app now runs a serverless API bundled with the frontend, this backend remains a complete, production-ready reference for learning, local testing, or future scaling when a dedicated Node.js service is preferred.

---

## Why Keep This Backend?

- Mirrors the exact API contract consumed by the React Query frontend (`/api/tasks`).
- Demonstrates both in-memory and file-based persistence strategies.
- Serves as a blueprint if you decide to split the backend into its own service (e.g., when adding authentication, databases, or advanced business logic).
- Great for educational walkthroughs of Express.js with modern tooling.

> **Note:** In the unified deployment, these files are not actively serving requests. They are here for documentation, reference, and future expansion opportunities.

---

## Project Structure

```text
task-manager-backend/
├── localDataServer.js   # Express server with filesystem persistence (tasks.json)
├── server.js            # Express server with in-memory task list
├── tasks.json           # Seed data for localDataServer.js persistence
├── package.json         # Scripts and dependencies (ES Modules enabled)
└── README.md            # Educational guide (this file)
```

- `server.js` is ideal for quick demos or prototypes; data resets on each restart.
- `localDataServer.js` reads/writes `tasks.json`, offering persistence without databases.
- `tasks.json` ships with sample tasks that align with the frontend defaults.

---

## Technology Stack & Keywords

- **Runtime:** Node.js (ES Module syntax enabled via `"type": "module"`).
- **Framework:** Express.js (`express`)
- **Utilities:**
  - `cors` (Cross-Origin Resource Sharing)
  - `morgan` (HTTP request logging)
  - `nanoid` (unique ID generation)
  - `fs/promises` (filesystem persistence for the local data server)
- **Development:** `nodemon` (auto-restart during development)

Keywords: Express.js API, RESTful routes, CRUD, React Query backend, serverless migration reference, in-memory storage, file-based persistence, nanoid, morgan, CORS.

---

## Getting Started

### 1. Install Dependencies

```bash
cd task-manager-backend
npm install
```

### 2. Environment Variables

Create a `.env` file (optional) to override the default port:

```bash
PORT=5000
```

If `.env` is omitted, the server listens on `process.env.PORT || 5000`.

### 3. Available Scripts

- **Run in-memory server (default workflow):**

  ```bash
  npm start
  ```

  Uses `server.js` with `nodemon`, serving routes backed by an in-memory array initialized with sample data.

- **Run persistent local data server:**

  ```bash
  npm run local-server
  ```

  Uses `localDataServer.js` to load and save tasks in `tasks.json` for basic persistence.

### 4. Test Endpoints

Once running, the API is accessible at `http://localhost:<PORT>/api/tasks`.

---

## API Walkthrough

Both `server.js` and `localDataServer.js` expose the same RESTful interface consumed by the frontend. The handlers are identical; only the storage layer differs.

### Base Route

`GET /`

```js
app.get("/", (req, res) => {
  res.send("<h1>Hello From Server...</h1>");
});
```

### Fetch Tasks

`GET /api/tasks`

```js
app.get("/api/tasks", (req, res) => {
  res.json({ taskList });
});
```

- Returns `{ taskList: Task[] }` where each task has `id`, `title`, and `isDone` properties.

### Create Task

`POST /api/tasks`

```js
app.post("/api/tasks", (req, res) => {
  const { title } = req.body;
  if (!title) {
    res.status(400).json({ msg: "please provide title" });
    return;
  }
  const newTask = { id: nanoid(), title, isDone: false };
  taskList = [...taskList, newTask];
  res.json({ task: newTask });
});
```

- Validates that `title` exists.
- Generates a unique identifier via `nanoid`.

### Update Task

`PATCH /api/tasks/:id`

```js
app.patch("/api/tasks/:id", (req, res) => {
  const { id } = req.params;
  const { isDone } = req.body;

  taskList = taskList.map((task) =>
    task.id === id ? { ...task, isDone } : task
  );

  res.json({ msg: "task updated" });
});
```

- Accepts `{ isDone: boolean }` to toggle completion state.
- Updates the matching task without mutating others.

### Delete Task

`DELETE /api/tasks/:id`

```js
app.delete("/api/tasks/:id", (req, res) => {
  const { id } = req.params;
  taskList = taskList.filter((task) => task.id !== id);
  res.json({ msg: "task removed" });
});
```

- Removes the task by ID and returns a confirmation message.

---

## Storage Strategies

| File                 | Persistence Model         | When to Use                                                  |
| -------------------- | ------------------------- | ------------------------------------------------------------ |
| `server.js`          | In-memory                 | Quick demos, testing React Query queries, ephemeral sessions |
| `localDataServer.js` | File-based (`tasks.json`) | Local development needing persistence without a DB           |

### `tasks.json`

```json
[
  { "id": "I0b-ENEAXbOSqW-E9S2zz", "title": "first task", "isDone": false },
  { "id": "hvBD6B_wfeNz2tUENiWQe", "title": "third task", "isDone": false },
  { "id": "b035W-cJYnwS3akrP5QQK", "title": "random task", "isDone": false }
]
```

- Feel free to edit or seed new data before launching `npm run local-server`.
- The local data server writes back to this file, so keep version control handy if you want to revert the dataset.

---

## Using This Backend in Other Projects

1. **Clone or Copy:** Drop the entire `task-manager-backend` folder into another project.
2. **Install Dependencies:** `npm install` inside the directory.
3. **Adapt Routes if Needed:**
   - Adjust the base path (e.g., `/api/v1/tasks`).
   - Layer in authentication (JWT, sessions) before the handlers.
4. **Swap the Storage Layer:**
   - Replace the `taskList` array with database calls (MongoDB, PostgreSQL, etc.).
   - Reuse the route structure to keep frontend contracts stable.
5. **Integrate with Frontend:** Configure the client’s `baseURL` to match wherever this server runs (local or hosted).

Because each route is isolated and pure, reusing them in another Express project is as simple as importing the router or copying the handler functions.

---

## Educational Highlights

- **Express Middleware Pipeline:** CORS, JSON body parsing, and Morgan demonstrate core middleware setup.
- **Error Handling:** 400-level validation responses keep the API consumer informed.
- **REST Principles:** CRUD operations follow standard HTTP verbs and resource paths.
- **ID Generation:** `nanoid` produces URL-safe IDs without collisions for small datasets.
- **Serverless Parity:** These handlers directly inspired the serverless functions now bundled with the frontend, making this a bridging example between monolithic and serverless architectures.

---

## Future Enhancements

- Swap `tasks.json` for a real database (MongoDB, PostgreSQL, PlanetScale, etc.).
- Add user authentication and per-user task lists.
- Implement pagination, filtering, and sorting on the `/api/tasks` endpoint.
- Introduce automated tests (Jest, Supertest) for integration coverage.
- Deploy as a standalone Node service when the project requires scaling beyond serverless limits.

---

## Conclusion

This backend offers a clean, well-documented foundation for Express.js development. Even though the current production deployment relies on serverless functions within the frontend project, maintaining this directory ensures you have a ready-made backend for future expansion, demos, or educational deep dives.

---

## Happy Coding! 🎉

Feel free to use this project repository and extend this project further!

If you have any questions or want to share your work, reach out via GitHub or my portfolio at [https://arnob-mahmud.vercel.app/](https://arnob-mahmud.vercel.app/).

**Enjoy building and learning!** 🚀

Thank you! 😊

---
