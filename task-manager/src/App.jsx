import { ToastContainer } from "react-toastify";
import Form from "./Form";
import Items from "./Items";

// Main application component - serves as the root layout
// ToastContainer provides toast notifications throughout the app (success/error messages)
const App = () => {
  return (
    <section className="section-center">
      {/* Toast notifications will appear at the top-center of the screen */}
      <ToastContainer position="top-center" />
      {/* Form component for creating new tasks */}
      <Form />
      {/* Items component that displays the list of tasks using React Query */}
      <Items />
    </section>
  );
};
export default App;
