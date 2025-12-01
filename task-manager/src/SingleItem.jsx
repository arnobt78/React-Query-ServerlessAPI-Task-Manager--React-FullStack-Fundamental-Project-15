import { useDeleteTask, useEditTask } from "./reactQueryCustomHooks";

// SingleItem component - renders an individual task with checkbox and delete button
// Each task item can be toggled (checked/unchecked) or deleted
const SingleItem = ({ item }) => {
  // React Query mutation hooks for editing and deleting tasks
  // editTask: function to toggle task completion status (isDone)
  // deleteTask: function to remove the task
  // deleteTaskLoading: loading state for delete operation (disables button during deletion)
  const { editTask } = useEditTask();
  const { deleteTask, deleteTaskLoading } = useDeleteTask();

  return (
    <div className="single-item">
      {/* Checkbox to toggle task completion status */}
      {/* When clicked, it inverts the current isDone value and triggers the mutation */}
      <input
        type="checkbox"
        checked={item.isDone}
        onChange={() => editTask({ taskId: item.id, isDone: !item.isDone })}
      />
      {/* Task title with conditional styling */}
      {/* textTransform: 'capitalize' makes first letter uppercase */}
      {/* textDecoration: adds strikethrough when task is completed */}
      <p
        style={{
          textTransform: "capitalize",
          textDecoration: item.isDone && "line-through",
        }}
      >
        {item.title}
      </p>
      {/* Delete button - disabled while deletion is in progress to prevent duplicate requests */}
      <button
        className="btn remove-btn"
        type="button"
        disabled={deleteTaskLoading}
        onClick={() => deleteTask(item.id)}
      >
        delete
      </button>
    </div>
  );
};
export default SingleItem;
