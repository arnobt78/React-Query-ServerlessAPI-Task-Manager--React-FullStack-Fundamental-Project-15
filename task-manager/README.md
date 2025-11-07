# Task Manager - React Query + Serverless API (FullStack React Fundamental Project 15)

A production-ready task manager that pairs a Vite-powered React frontend with serverless API routes. The app demonstrates how to fetch, mutate, and persist data with React Query while bundling the backend logic into the same repository for easy deployment to Vercel or Netlify.

- **Live-Demo:** [https://react-query-task-manager.netlify.app/](https://react-query-task-manager.netlify.app/)

![Screenshot 2025-11-07 at 15 16 03](https://github.com/user-attachments/assets/e88ea46d-9fa7-4c09-b292-33f1b149c2b1)

---

## Key Features

- React Query-powered CRUD interface with optimistic updates and toast notifications.
- Serverless REST API (`/api/tasks`) for GET/POST/PATCH/DELETE, backed by a shared task store.
- Automatic browser `localStorage` sync to keep tasks available across page refreshes.
- Ready-to-run Netlify Functions and Vercel serverless handlers with identical logic.
- Educational Express.js reference backend available in `task-manager-backend-reference/` for comparison and future scaling.

---

## Tech Stack

- **Frontend:** React 18, Vite, React Query, React Toastify.
- **API Layer:** Serverless functions (Vercel-style handlers + Netlify Functions) using Node.js.
- **Utilities:** Axios, nanoid, browser `localStorage`.
- **Styling:** Custom CSS (`src/index.css`).
- **Tooling:** ES Modules, npm scripts, optional Netlify/Vercel CLIs.

---

## Project Structure

```text
task-manager/
├── api/
│   ├── _lib/
│   │   └── taskStore.js        # Shared helpers for reading/writing task data
│   ├── tasks/
│   │   ├── index.js            # GET/POST serverless handler
│   │   └── [id].js             # PATCH/DELETE serverless handler
│   └── tasks.data.json         # Seed data shipped with the app
├── netlify/
│   └── functions/              # Netlify-compatible wrappers (tasks.js, task.js)
├── public/                     # Static assets (favicon, etc.)
├── src/
│   ├── App.jsx                 # Root layout
│   ├── Form.jsx                # Task creation form
│   ├── Items.jsx               # Task list rendered via React Query
│   ├── SingleItem.jsx          # Individual task component
│   ├── reactQueryCustomHooks.jsx
│   ├── localStorageUtils.js
│   ├── utils.js                # Axios instance + base URL selection
│   ├── index.css               # Styles
│   └── main.jsx                # App bootstrap + QueryClient setup
├── netlify.toml                # Deploy config (redirects for SPA)
├── package.json
└── README.md                   # You are here

task-manager-backend-reference/
└── ...                         # Full Express.js backend (educational reference)
```

---

## Getting Started

1. **Install dependencies**

   ```bash
   cd task-manager
   npm install
   ```

2. **Run the development server**

   ```bash
   npm run dev
   ```

   - The Vite dev server runs on `http://localhost:5173` by default.
   - API calls hit the configured base URL (see Environment Variables below).

3. **Optional – run serverless APIs locally**

   - **Vercel:** `npx vercel dev`
   - **Netlify:** `npx netlify dev`

   These commands proxy `/api/tasks` to the local serverless handlers so the frontend uses the same routes it will have in production.

---

## Environment Variables

The project works out-of-the-box without a `.env` file. Use environment variables only if you want to point the frontend at a different API base URL.

| Variable            | Default                                                      | Purpose                                                                                                                     |
| ------------------- | ------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------- |
| `VITE_API_BASE_URL` | `https://task-management-server-nyfr.onrender.com/api/tasks` | Overrides the Axios base URL defined in `src/utils.js`. Set this to `/api/tasks` when deploying the bundled serverless API. |

### Creating `.env.local`

1. Duplicate `.env` (if you create one) or create a new `.env.local` in the project root.
2. Add your overrides:

   ```env
   VITE_API_BASE_URL=/api/tasks
   ```

3. Restart `npm run dev` so Vite picks up the change.

> When deploying to Vercel or Netlify, set `VITE_API_BASE_URL=/api/tasks` in the project’s dashboard to ensure the frontend talks to the serverless routes.

---

## Available Scripts

- `npm run dev` – Start the Vite development server.
- `npm run build` – Build the production-ready bundle (outputs to `dist/`).
- `npm run preview` – Preview the production build locally.

Serverless platforms run the handlers in `api/` or `netlify/functions/` automatically—no extra script is required.

---

## API Endpoints

All endpoints live under `/api/tasks` once deployed (or under whatever base URL you configure).

### `GET /api/tasks`

Returns all tasks.

```json
{
  "taskList": [{ "id": "abc", "title": "walk the dog", "isDone": false }]
}
```

### `POST /api/tasks`

Creates a task with the given title.

```http
POST /api/tasks
Content-Type: application/json

{ "title": "ship serverless" }
```

```json
{
  "task": { "id": "xyz", "title": "ship serverless", "isDone": false }
}
```

### `PATCH /api/tasks/:id`

Updates the `isDone` status.

```http
PATCH /api/tasks/xyz
Content-Type: application/json

{ "isDone": true }
```

```json
{ "msg": "task updated" }
```

### `DELETE /api/tasks/:id`

Removes a task.

```http
DELETE /api/tasks/xyz
```

```json
{ "msg": "task removed" }
```

---

## Frontend Walkthrough

- `main.jsx` bootstraps React, wraps the app with `QueryClientProvider`, and imports global styles.
- `App.jsx` renders the overall layout, the submission form, the task list, and the toast container.
- `Form.jsx` captures user input and calls `useCreateTask` to create tasks. On success, it clears the form and shows a toast.
- `Items.jsx` uses `useFetchTasks` to load tasks and conditionally renders loading/error states.
- `SingleItem.jsx` renders each task as a checkbox + label + delete button, delegating logic to `useEditTask` and `useDeleteTask`.
- `index.css` defines all styling (including form layout, button styles, and transitions).

Each component is purposefully small, making it easy to lift into other projects.

---

## React Query Data Flow

```jsx
const { isLoading, data } = useQuery({
  queryKey: ["tasks"],
  queryFn: async () => {
    const { data } = await customFetch.get("/");
    return data;
  },
});
```

- `useFetchTasks` provides caching, refetching, and `localStorage` hydration.
- Mutations (`useCreateTask`, `useEditTask`, `useDeleteTask`) update the cache immediately via `setQueryData` before refetching, giving the UI instant feedback.
- Errors trigger `toast.error`, while successes trigger `toast.success` or silent state updates.

---

## Local Storage Persistence

- `localStorageUtils.js` encapsulates read/write helpers keyed by `react-query-task-manager`.
- On successful fetch or mutation, the hook writes the latest `taskList` to `localStorage`.
- On app load, React Query seeds its cache from `localStorage` so tasks appear instantly even before the first network request succeeds.

This hybrid approach provides a friendly offline-ish experience without adding a full offline database.

---

## Reusing Components & Hooks

### Components

- **`Form.jsx`** can be imported into any React project; pass a `createTask` mutation prop or swap in another hook to adapt the behavior.
- **`SingleItem.jsx`** expects an `item` with `{ id, title, isDone }`. Replace the mutation hooks for different persistence layers.

### Hooks

- **`useFetchTasks`** requires an Axios instance returning `{ taskList }`. Point `customFetch` to any API that matches the response shape.
- **Mutations** rely on REST conventions (`POST /`, `PATCH /:id`, `DELETE /:id`). Adjust `customFetch` or the hook definitions to target different endpoints or payloads.

Because the hooks centralize data fetching, components stay thin and easy to migrate between projects.

---

## Deployment Guide

### Vercel

1. Connect the repository in the Vercel dashboard.
2. Set `VITE_API_BASE_URL` to `/api/tasks` (Project Settings → Environment Variables).
3. Deploy. Vercel automatically detects the Vite build and the `api/` directory for serverless routes.

### Netlify

1. Connect the repository in Netlify.
2. Ensure the build command is `npm run build` and publish directory is `dist`.
3. Add environment variable `VITE_API_BASE_URL=/api/tasks`.
4. (Optional) Include the redirect rules shown below if you need explicit rewrites:

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

Netlify deploys the functions defined in `netlify/functions/` automatically.

---

## Working with the Express Reference Backend

The standalone Express backend now lives in `task-manager-backend-reference/`.

- It is **not** used in the serverless deployment, but it provides the same REST API for study or future migration to a dedicated Node.js service.
- Use it when you want to:
  - Practice Express routing and middleware.
  - Swap in a database-backed persistence layer.
  - Run the backend separately once the project grows.

### Running the Express backend

```bash
cd task-manager-backend-reference
npm install
npm start        # for in-memory server
# or
npm run local-server   # for file-backed persistence via tasks.json
```

Point the frontend to this backend by setting `VITE_API_BASE_URL=http://localhost:5000/api/tasks` while it’s running.

---

## Keywords

Task manager, React Query, Vite, serverless API, Netlify Functions, Vercel serverless functions, Express.js reference backend, nanoid, localStorage persistence, CRUD tutorial, full-stack React project.

---

## Conclusion

This repository showcases how to unify a modern React frontend with colocated serverless APIs, while keeping a full Express.js backend on standby for deeper exploration. Use it as a template to learn, teach others, or bootstrap your next productivity tool.

---

## Happy Coding! 🎉

Feel free to use this project repository and extend this project further!

If you have any questions or want to share your work, reach out via GitHub or my portfolio at [https://arnob-mahmud.vercel.app/](https://arnob-mahmud.vercel.app/).

**Enjoy building and learning!** 🚀

Thank you! 😊

---
