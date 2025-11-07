// import axios from 'axios';

// const customFetch = axios.create({
//   baseURL: 'http://localhost:5000/api/tasks',
// });

// export default customFetch;
import axios from "axios";

const defaultBaseURL =
  import.meta.env.VITE_API_BASE_URL ||
  "https://task-management-server-nyfr.onrender.com/api/tasks";

// Remove trailing slash if present
const cleanBaseURL = defaultBaseURL.replace(/\/$/, "");

const customFetch = axios.create({
  baseURL: cleanBaseURL,
});

export default customFetch;
