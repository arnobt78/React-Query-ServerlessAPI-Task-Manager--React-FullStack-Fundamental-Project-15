import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import "react-toastify/dist/ReactToastify.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Create a QueryClient instance to manage React Query's cache, state, and configuration
// This client will handle all data fetching, caching, and synchronization for our app
const queryClient = new QueryClient();

// Bootstrap the React application
// QueryClientProvider wraps the entire app, making React Query hooks available to all child components
ReactDOM.createRoot(document.getElementById("root")).render(
  <QueryClientProvider client={queryClient}>
    <App />
  </QueryClientProvider>
);
