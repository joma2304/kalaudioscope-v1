import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom"; // Importera BrowserRouter
import App from "./App";
import "./index.css"; // Importera CSS för hela appen

const root = ReactDOM.createRoot(document.getElementById("root") as HTMLElement);
root.render(
    <BrowserRouter>
      <App />
    </BrowserRouter>
);