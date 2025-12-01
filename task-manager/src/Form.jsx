import { useState } from "react";
import { useCreateTask } from "./reactQueryCustomHooks";

// Form component for creating new tasks
// Uses React Query's mutation hook to handle task creation with optimistic updates
const Form = () => {
  // Local state to manage the input field value
  const [newItemName, setNewItemName] = useState("");

  // React Query mutation hook - handles API call and cache updates
  // isLoading: indicates if the mutation is in progress (useful for disabling submit button)
  // createTask: the mutation function that will be called when form is submitted
  const { isLoading, createTask } = useCreateTask();

  // Handle form submission
  // Prevents default form behavior and triggers the mutation
  // onSuccess callback clears the input field after successful task creation
  const handleSubmit = (e) => {
    e.preventDefault();
    createTask(newItemName, {
      onSuccess: () => {
        setNewItemName("");
      },
    });
  };
  return (
    <form onSubmit={handleSubmit}>
      <h4>task bud</h4>
      <div className="form-control">
        <input
          type="text "
          className="form-input"
          value={newItemName}
          onChange={(event) => setNewItemName(event.target.value)}
        />
        {/* Button is disabled while mutation is in progress to prevent duplicate submissions */}
        <button type="submit" className="btn" disabled={isLoading}>
          add task
        </button>
      </div>
    </form>
  );
};
export default Form;
