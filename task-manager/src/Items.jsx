import SingleItem from "./SingleItem";
import { useFetchTasks } from "./reactQueryCustomHooks";

// Items component - displays the list of tasks
// Uses React Query to fetch tasks from the API with automatic caching and refetching
const Items = () => {
  // React Query hook that handles fetching tasks
  // isLoading: true while the initial fetch is in progress
  // isError: true if the fetch failed
  // data: contains the fetched tasks data (structure: { taskList: [...] })
  const { isLoading, isError, data } = useFetchTasks();

  // Show loading state while fetching data
  if (isLoading) {
    return <p style={{ marginTop: "1rem " }}>Loading...</p>;
  }
  // Show error state if the API call failed
  if (isError) {
    return <p style={{ marginTop: "1rem " }}>There was an error...</p>;
  }

  // Add safety check for data and taskList
  // Ensures data exists and has the expected structure before rendering
  // This prevents crashes if API returns unexpected data format
  if (!data || !data.taskList || !Array.isArray(data.taskList)) {
    return <p style={{ marginTop: "1rem " }}>No tasks found...</p>;
  }

  // Render the list of tasks
  // Each task is rendered as a SingleItem component
  // key prop is required by React for list rendering (using task.id for uniqueness)
  return (
    <div className="items">
      {data.taskList.map((item) => {
        return <SingleItem key={item.id} item={item} />;
      })}
    </div>
  );
};
export default Items;
