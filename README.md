# Task Manager - React Query, Serverless API, & Express Reference Backend (FullStack React Fundamental Project 15)

This repository bundles two complementary projects:

- `task-manager/` – The production-ready React + serverless application that ships a full task manager with colocated API routes for Vercel/Netlify deployments.
- `task-manager-backend-reference/` – A complete Express.js backend kept for educational purposes, local experimentation, and future scaling scenarios.

Use this repo to explore modern full-stack patterns, study code organization, and learn how to migrate from a traditional Node server to serverless functions without losing the original implementation.

- **Live-Demo:** [https://react-query-task-manager.netlify.app/](https://react-query-task-manager.netlify.app/)

![Screenshot 2025-11-07 at 15 16 03](https://github.com/user-attachments/assets/e88ea46d-9fa7-4c09-b292-33f1b149c2b1)

---

## Table of Contents

- [Task Manager (Frontend + Serverless API)](#task-manager-frontend--serverless-api)
  - [Features](#features)
  - [Tech Stack](#tech-stack)
  - [Project Structure](#project-structure)
  - [Getting Started](#getting-started)
  - [Environment Variables](#environment-variables)
  - [Available Scripts](#available-scripts)
  - [API Endpoints](#api-endpoints)
  - [Frontend Walkthrough](#frontend-walkthrough)
  - [React Query Data Flow](#react-query-data-flow)
  - [Local Storage Persistence](#local-storage-persistence)
  - [Reusing Components & Hooks](#reusing-components--hooks)
  - [Deployment Guide](#deployment-guide)
  - [Keywords](#keywords)
  - [Conclusion](#conclusion)
- [Task Manager Backend Reference (Express.js)](#task-manager-backend-reference-expressjs)
  - [Why Keep the Reference Backend](#why-keep-the-reference-backend)
  - [Structure & Technology](#structure--technology)
  - [Setup & Usage](#setup--usage)
  - [API Walkthrough](#api-walkthrough)
  - [Persistence Modes](#persistence-modes)
  - [Reuse Ideas](#reuse-ideas)

---

## Task Manager (Frontend + Serverless API)

### Features

- Vite-powered React app with real-time task management.
- Serverless REST API exposed under `/api/tasks`, sharing code between Vercel and Netlify deployments.
- React Query handles fetching, caching, optimistic updates, and background refetches.
- Local storage synchronization for near-instant UI hydration across page refreshes.
- Toast notifications for success/error feedback.
- Lightweight CSS styling and reusable components/hooks for easy reuse.

---

### Tech Stack

- **Frontend:** React 18, Vite, React Query (@tanstack/react-query), React Toastify.
- **API:** Node.js serverless functions (Vercel-esque handlers + Netlify wrappers).
- **Utilities:** Axios, nanoid, localStorage.
- **Tooling:** ES Modules, npm, Netlify/Vercel CLIs (optional).

---

### Project Structure

```text
task-manager/
├── api/
│   ├── _lib/
│   │   └── taskStore.js        # Shared storage helpers
│   ├── tasks/
│   │   ├── index.js            # GET/POST handler
│   │   └── [id].js             # PATCH/DELETE handler
│   └── tasks.data.json         # Seed dataset
├── netlify/
│   └── functions/              # Netlify compatible serverless functions
├── public/                     # Static assets
├── src/
│   ├── App.jsx
│   ├── Form.jsx
│   ├── Items.jsx
│   ├── SingleItem.jsx
│   ├── reactQueryCustomHooks.jsx
│   ├── localStorageUtils.js
│   ├── utils.js
│   ├── index.css
│   └── main.jsx
├── netlify.toml
├── package.json
└── README.md
```

---

### Getting Started

1. **Install dependencies**

   ```bash
   cd task-manager
   npm install
   ```

2. **Start the development server**

   ```bash
   npm run dev
   ```

   Visit `http://localhost:5173`. The app defaults to the hosted backend unless configured otherwise (see environment variables).

3. **Optional: emulate serverless functions locally**

   - Vercel: `npx vercel dev`
   - Netlify: `npx netlify dev`

   These commands allow the frontend to call the local `/api/tasks` endpoints exactly as they’ll exist after deployment.

---

### Environment Variables

The frontend works without any `.env` file. Override settings only when you need to point to a different API base URL.

| Variable            | Default                                                      | Purpose                                                                                                                |
| ------------------- | ------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| `VITE_API_BASE_URL` | `https://task-management-server-nyfr.onrender.com/api/tasks` | Overrides the Axios base URL defined in `src/utils.js`. Set to `/api/tasks` when deploying the bundled serverless API. |

#### Creating `.env.local`

```bash
cd task-manager
echo "VITE_API_BASE_URL=/api/tasks" > .env.local
```

Restart `npm run dev` so Vite can pick up the new value. In Netlify/Vercel dashboards, add the same variable under project settings.

---

### Available Scripts

- `npm run dev` – start Vite in development mode.
- `npm run build` – create a production build in `dist/`.
- `npm run preview` – preview the production build locally.

Serverless functions deploy automatically; no additional script is required.

---

### API Endpoints

The frontend expects the following REST routes (served by serverless handlers or the reference backend):

#### `GET /api/tasks`

```json
{
  "taskList": [{ "id": "abc", "title": "walk the dog", "isDone": false }]
}
```

#### `POST /api/tasks`

```http
POST /api/tasks
Content-Type: application/json

{ "title": "Ship serverless" }
```

```json
{
  "task": { "id": "xyz", "title": "Ship serverless", "isDone": false }
}
```

#### `PATCH /api/tasks/:id`

```http
PATCH /api/tasks/xyz
Content-Type: application/json

{ "isDone": true }
```

#### `DELETE /api/tasks/:id`

```http
DELETE /api/tasks/xyz
```

Each mutation returns a confirmation message (`{ "msg": "task updated" }`, `{ "msg": "task removed" }`).

---

### Frontend Walkthrough

- `main.jsx` initializes React, injects global styles, and wraps the tree in `QueryClientProvider`.
- `App.jsx` houses the layout: toast notifications, task form, and task list.
- `Form.jsx` captures input, calls `useCreateTask`, and clears the field on success.
- `Items.jsx` uses `useFetchTasks` to display loading/error states and the current `taskList`.
- `SingleItem.jsx` handles toggling completion via checkbox and deleting via button.
- `reactQueryCustomHooks.jsx` centralizes fetching and mutation logic, including `localStorage` syncing.
- `localStorageUtils.js` abstracts read/write/remove operations to keep components clean.
- `utils.js` configures Axios to use the appropriate base URL.

Each component is self-contained, making it straightforward to port pieces into other applications.

---

### React Query Data Flow

```jsx
const { data, isLoading, isError } = useQuery({
  queryKey: ["tasks"],
  queryFn: async () => {
    const { data } = await customFetch.get("/");
    return data;
  },
  initialData: () => {
    const cached = readTasksFromStorage();
    return cached ? { taskList: cached } : undefined;
  },
});
```

- `useFetchTasks` seeds the cache from `localStorage`, fetches from the network, and writes back on success.
- Mutations update the cache immediately via `queryClient.setQueryData`, write to `localStorage`, then trigger `invalidateQueries` for server confirmation.
- Toast notifications surface success or error states for create/edit/delete actions.

---

### Local Storage Persistence

- Tasks are cached under the key `react-query-task-manager`.
- On load, the UI renders cached tasks instantly, then reconciles with server responses.
- This approach gives a pleasant pseudo-offline experience without extra backend complexity.

---

### Reusing Components & Hooks

- **`Form.jsx`** – swap `useCreateTask` for any mutation hook to reuse the component in other contexts (e.g., shopping list, note taker).
- **`SingleItem.jsx`** – expects props `{ id, title, isDone }`; replace mutation hooks to integrate with different backends.
- **Hooks** – point `customFetch` to another API that matches the same response shape. Because logic lives in hooks, the UI remains agnostic to the persistence layer.

---

### Deployment Guide

#### Vercel

1. Import the repository in Vercel.
2. Set `VITE_API_BASE_URL=/api/tasks` in Project Settings → Environment Variables.
3. Deploy – Vercel detects the Vite app and the `api/` folder automatically.

#### Netlify

1. Import the repository in Netlify.
2. Build command: `npm run build`; Publish directory: `dist`.
3. Environment variable: `VITE_API_BASE_URL=/api/tasks`.
4. Optional rewrites (if needed):

   ```toml
   [[redirects]]
     from = "/api/tasks"
     to = "/.netlify/functions/tasks"
     status = 200
     force = true

   [[redirects]]
     from = "/api/tasks/*"
     to = "/.netlify/functions/task/:splat"
     status = 200
     force = true
   ```

Netlify automatically builds the functions defined in `netlify/functions/`.

---

### Keywords

Task manager, React Query, Vite, serverless API, Netlify Functions, Vercel functions, nanoid, Axios, localStorage, SPA, CRUD tutorial, full-stack React fundamental project.

---

### Conclusion

The `task-manager/` project demonstrates how to build a cohesive full-stack app by colocating the frontend and backend code. It provides production-ready defaults while remaining approachable for learners and easily adaptable for other domains.

---

## Task Manager Backend Reference (Express.js)

### Why Keep the Reference Backend

- Captures the original Express implementation before migrating to serverless functions.
- Helpful for understanding middleware pipelines, routing, and persistence strategies in Node.
- Serves as a starting point for scaling into a dedicated backend service once the project grows (e.g., adding authentication or database integrations).

> The reference backend is **not** used in the serverless deployment, but it mirrors the same API contract.

---

### Structure & Technology

```text
task-manager-backend-reference/
├── server.js            # In-memory task list (nodemon start)
├── localDataServer.js   # File-based persistence via tasks.json
├── tasks.json           # Seed data
├── package.json         # Express, cors, morgan, nanoid, nodemon
└── README.md            # Detailed educational guide
```

- **Express.js** handles routes and middleware.
- **cors** allows the React frontend to make cross-origin requests during local development.
- **morgan** logs HTTP requests in development mode.
- **nanoid** generates unique task IDs.
- **nodemon** restarts the server automatically when files change.

---

### Setup & Usage

```bash
cd task-manager-backend-reference
npm install

# In-memory server
npm start

# File-backed server (reads/writes tasks.json)
npm run local-server
```

Optional `.env`:

```env
PORT=5000
```

- `server.js` and `localDataServer.js` default to `5000` if `PORT` is not set.
- Adjust `VITE_API_BASE_URL` in the frontend to `http://localhost:5000/api/tasks` when using this backend.

---

### API Walkthrough

Handlers in both `server.js` and `localDataServer.js` match the serverless routes:

- `GET /api/tasks` – returns `{ taskList }`.
- `POST /api/tasks` – validates `title`, creates a new task with `isDone: false`.
- `PATCH /api/tasks/:id` – toggles `isDone` based on request body.
- `DELETE /api/tasks/:id` – removes a task.

The 404 middleware responds with `Route does not exist` for unmatched routes.

---

### Persistence Modes

| File                 | Description                                 | When to Use                            |
| -------------------- | ------------------------------------------- | -------------------------------------- |
| `server.js`          | In-memory array seeded on boot              | Quick demos, ephemeral testing         |
| `localDataServer.js` | Reads/writes `tasks.json` using fs/promises | Local dev requiring simple persistence |

`tasks.json` ships with sample tasks mirroring the frontend’s defaults.

---

### Reuse Ideas

- Integrate the Express routes into larger Node/Express projects.
- Swap the `taskList` array for a real database (MongoDB, PostgreSQL, Prisma, etc.).
- Extend the API with authentication, pagination, or filtering.
- Use the reference code as teaching material for REST fundamentals or Express middleware.

Because the API matches the serverless version, you can switch implementations without touching the React code—just change the base URL.

---

## Happy Coding! 🎉

Feel free to use this project repository and extend this project further!

If you have any questions or want to share your work, reach out via GitHub or my portfolio at [https://arnob-mahmud.vercel.app/](https://arnob-mahmud.vercel.app/).

**Enjoy building and learning!** 🚀

Thank you! 😊

---
