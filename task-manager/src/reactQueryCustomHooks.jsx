import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import customFetch from "./utils";
import { toast } from "react-toastify";
import { readTasksFromStorage, writeTasksToStorage } from "./localStorageUtils";
export const useFetchTasks = () => {
  const { isLoading, data, isError, error } = useQuery({
    queryKey: ["tasks"],
    queryFn: async () => {
      const { data } = await customFetch.get("/");
      return data;
    },
    initialData: () => {
      const cachedTasks = readTasksFromStorage();
      if (cachedTasks) {
        return { taskList: cachedTasks };
      }
      return undefined;
    },
    onSuccess: (result) => {
      if (result && Array.isArray(result.taskList)) {
        writeTasksToStorage(result.taskList);
      }
    },
  });
  return { isLoading, isError, data };
};

export const useCreateTask = () => {
  const queryClient = useQueryClient();
  const { mutate: createTask, isLoading } = useMutation({
    mutationFn: (taskTitle) => customFetch.post("/", { title: taskTitle }),
    onSuccess: ({ data }) => {
      queryClient.setQueryData(["tasks"], (oldData) => {
        if (!data || !data.task) {
          return oldData;
        }
        const taskList = oldData?.taskList || [];
        const updatedTaskList = [...taskList, data.task];
        writeTasksToStorage(updatedTaskList);
        if (!oldData) {
          return { taskList: updatedTaskList };
        }
        return { ...oldData, taskList: updatedTaskList };
      });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast.success("task added");
    },
    onError: (error) => {
      toast.error(error?.response?.data?.msg || "something went wrong");
    },
  });
  return { createTask, isLoading };
};

export const useEditTask = () => {
  const queryClient = useQueryClient();

  const { mutate: editTask } = useMutation({
    mutationFn: ({ taskId, isDone }) => {
      return customFetch.patch(`/${taskId}`, { isDone });
    },
    onSuccess: (_, variables) => {
      queryClient.setQueryData(["tasks"], (oldData) => {
        if (!oldData || !Array.isArray(oldData.taskList)) {
          return oldData;
        }
        const updatedTaskList = oldData.taskList.map((task) => {
          if (task.id === variables.taskId) {
            return { ...task, isDone: variables.isDone };
          }
          return task;
        });
        writeTasksToStorage(updatedTaskList);
        return { ...oldData, taskList: updatedTaskList };
      });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
  return { editTask };
};
export const useDeleteTask = () => {
  const queryClient = useQueryClient();

  const { mutate: deleteTask, isLoading: deleteTaskLoading } = useMutation({
    mutationFn: (taskId) => {
      return customFetch.delete(`/${taskId}`);
    },
    onSuccess: (_, taskId) => {
      queryClient.setQueryData(["tasks"], (oldData) => {
        if (!oldData || !Array.isArray(oldData.taskList)) {
          return oldData;
        }
        const updatedTaskList = oldData.taskList.filter(
          (task) => task.id !== taskId
        );
        writeTasksToStorage(updatedTaskList);
        return { ...oldData, taskList: updatedTaskList };
      });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
  return { deleteTask, deleteTaskLoading };
};
