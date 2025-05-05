import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom"; // Importera BrowserRouter
import App from "./App";

const root = ReactDOM.createRoot(document.getElementById("root") as HTMLElement);
root.render(
    <BrowserRouter>
      <App />
    </BrowserRouter>
);