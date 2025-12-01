// Custom React Query hooks for task management
// These hooks encapsulate data fetching, mutations, and cache management using React Query
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import customFetch from "./utils";
import { toast } from "react-toastify";
import { readTasksFromStorage, writeTasksToStorage } from "./localStorageUtils";

// Hook for fetching tasks from the API
// Uses React Query's useQuery for automatic caching, refetching, and state management
export const useFetchTasks = () => {
  const { isLoading, data, isError, error } = useQuery({
    // queryKey: unique identifier for this query in React Query's cache
    // Used for cache invalidation and refetching
    queryKey: ["tasks"],
    // queryFn: async function that fetches data from the API
    // This is called automatically when the query needs to fetch/refetch data
    queryFn: async () => {
      try {
        // Make GET request to fetch tasks (empty string "" means use baseURL only)
        const { data } = await customFetch.get("");
        return data;
      } catch (error) {
        console.error("API Error:", error);
        // Return fallback data structure instead of throwing error
        // This allows the UI to render even if the API call fails
        return { taskList: [] };
      }
    },
    // initialData: function that provides data before the first fetch completes
    // This enables instant UI rendering from localStorage cache (no loading spinner on first load)
    initialData: () => {
      const cachedTasks = readTasksFromStorage();
      if (cachedTasks) {
        return { taskList: cachedTasks };
      }
      return { taskList: [] }; // Provide default structure
    },
    // onSuccess: callback fired after successful API fetch
    // Syncs the fetched data to localStorage to keep it up-to-date
    onSuccess: (result) => {
      if (result && Array.isArray(result.taskList)) {
        writeTasksToStorage(result.taskList);
      }
    },
    // onError: callback fired if the query fails
    // Shows user-friendly error message via toast notification
    onError: (error) => {
      console.error("Query Error:", error);
      toast.error("Failed to load tasks. Please check your connection.");
    },
  });
  return { isLoading, isError, data };
};

// Hook for creating a new task
// Uses React Query's useMutation for optimistic updates and cache management
export const useCreateTask = () => {
  // Get access to QueryClient instance to manually update cache
  const queryClient = useQueryClient();
  const { mutate: createTask, isLoading } = useMutation({
    // mutationFn: async function that makes the API call to create a task
    // Receives taskTitle as parameter and sends POST request to the server
    mutationFn: (taskTitle) => customFetch.post("", { title: taskTitle }),
    // onSuccess: callback fired after successful task creation
    // Implements optimistic update pattern: immediately updates UI before refetching
    onSuccess: ({ data }) => {
      // Manually update the cache with the new task (optimistic update)
      // This gives instant UI feedback without waiting for a refetch
      queryClient.setQueryData(["tasks"], (oldData) => {
        // Safety check: ensure we have valid task data from API response
        if (!data || !data.task) {
          return oldData;
        }
        // Get existing tasks or empty array as fallback
        const taskList = oldData?.taskList || [];
        // Add new task to the list (creates new array to maintain immutability)
        const updatedTaskList = [...taskList, data.task];
        // Sync updated list to localStorage
        writeTasksToStorage(updatedTaskList);
        // Return updated cache data
        if (!oldData) {
          return { taskList: updatedTaskList };
        }
        return { ...oldData, taskList: updatedTaskList };
      });
      // Invalidate and refetch to ensure cache stays in sync with server
      // This is a safety net in case server state differs from our optimistic update
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      // Show success notification to user
      toast.success("task added");
    },
    // onError: callback fired if task creation fails
    // Extracts error message from API response or shows generic error
    onError: (error) => {
      toast.error(error?.response?.data?.msg || "something went wrong");
    },
  });
  return { createTask, isLoading };
};

// Hook for editing/updating a task (toggling completion status)
// Uses optimistic updates to immediately reflect changes in the UI
export const useEditTask = () => {
  const queryClient = useQueryClient();

  const { mutate: editTask } = useMutation({
    // mutationFn: makes PATCH request to update task's isDone status
    // Receives { taskId, isDone } object and sends update to server
    mutationFn: ({ taskId, isDone }) => {
      return customFetch.patch(`/${taskId}`, { isDone });
    },
    // onSuccess: optimistically updates cache before refetching
    // variables parameter contains the original mutation input (taskId, isDone)
    onSuccess: (_, variables) => {
      // Manually update cache to reflect the toggle immediately
      queryClient.setQueryData(["tasks"], (oldData) => {
        // Safety check: ensure we have valid data structure
        if (!oldData || !Array.isArray(oldData.taskList)) {
          return oldData;
        }
        // Map through tasks and update the one that matches taskId
        // Uses map() instead of direct mutation to maintain immutability
        const updatedTaskList = oldData.taskList.map((task) => {
          if (task.id === variables.taskId) {
            return { ...task, isDone: variables.isDone };
          }
          return task;
        });
        // Sync updated list to localStorage
        writeTasksToStorage(updatedTaskList);
        // Return updated cache data
        return { ...oldData, taskList: updatedTaskList };
      });
      // Invalidate and refetch to sync with server state
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
  return { editTask };
};
// Hook for deleting a task
// Uses optimistic updates to immediately remove task from UI
export const useDeleteTask = () => {
  const queryClient = useQueryClient();

  const { mutate: deleteTask, isLoading: deleteTaskLoading } = useMutation({
    // mutationFn: makes DELETE request to remove task from server
    // Receives taskId and sends DELETE request to /api/tasks/:taskId
    mutationFn: (taskId) => {
      return customFetch.delete(`/${taskId}`);
    },
    // onSuccess: optimistically removes task from cache before refetching
    // taskId parameter comes from the mutation input (second parameter)
    onSuccess: (_, taskId) => {
      // Manually update cache to immediately remove the task from UI
      queryClient.setQueryData(["tasks"], (oldData) => {
        // Safety check: ensure we have valid data structure
        if (!oldData || !Array.isArray(oldData.taskList)) {
          return oldData;
        }
        // Filter out the deleted task (returns new array without the task)
        // Maintains immutability by creating new array instead of mutating existing
        const updatedTaskList = oldData.taskList.filter(
          (task) => task.id !== taskId
        );
        // Sync updated list to localStorage
        writeTasksToStorage(updatedTaskList);
        // Return updated cache data
        return { ...oldData, taskList: updatedTaskList };
      });
      // Invalidate and refetch to ensure cache matches server state
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
  // Return deleteTask function and loading state
  // deleteTaskLoading is used to disable delete button during deletion
  return { deleteTask, deleteTaskLoading };
};
