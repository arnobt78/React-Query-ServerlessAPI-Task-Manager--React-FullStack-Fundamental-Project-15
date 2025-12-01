import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import "react-toastify/dist/ReactToastify.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Create a QueryClient instance to manage React Query's cache, state, and configuration
// Configured for cache-first strategy: reads from cache, only API calls on mutations
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Disable automatic refetching on window focus to prevent unnecessary API calls
      // Users clicking input fields shouldn't trigger network requests
      refetchOnWindowFocus: false,
      // Disable automatic refetching on reconnect to prevent extra calls
      refetchOnReconnect: false,
      // Disable automatic refetching on mount if data already exists in cache
      // This ensures we use cached data instead of making new API calls
      refetchOnMount: false,
      // Stale time: data is considered fresh indefinitely (per-query config can override)
      // This prevents automatic refetches - cache is always trusted
      staleTime: Infinity, // Data never becomes stale - always use cache
      // cacheTime: unused data stays in cache for 24 hours (React Query v4)
      // This ensures data persists across page refreshes and sessions
      cacheTime: 1000 * 60 * 60 * 24, // 24 hours
    },
  },
});

// Bootstrap the React application
// QueryClientProvider wraps the entire app, making React Query hooks available to all child components
ReactDOM.createRoot(document.getElementById("root")).render(
  <QueryClientProvider client={queryClient}>
    <App />
  </QueryClientProvider>
);
