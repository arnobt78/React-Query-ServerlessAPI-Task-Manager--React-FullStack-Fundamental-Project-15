// import axios from 'axios';

// const customFetch = axios.create({
//   baseURL: 'http://localhost:5000/api/tasks',
// });

// export default customFetch;

// Axios instance configuration for API calls
// This centralized configuration ensures all API requests use the correct base URL
import axios from "axios";

// Determine the API base URL based on environment
// Priority: 1. VITE_API_BASE_URL env variable (set in Netlify/Vercel), 2. Default to "/api/tasks"
// "/api/tasks" works with serverless functions deployed on Netlify/Vercel via redirects
const defaultBaseURL = import.meta.env.VITE_API_BASE_URL || "/api/tasks";

// Remove trailing slash if present
// Ensures consistent URL formatting (avoids issues with double slashes)
const cleanBaseURL = defaultBaseURL.replace(/\/$/, "");

// Create a configured Axios instance with the base URL
// All requests using this instance will automatically prepend the baseURL
// Example: customFetch.get("/") becomes GET request to "/api/tasks/"
const customFetch = axios.create({
  baseURL: cleanBaseURL,
});

export default customFetch;
