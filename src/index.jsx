import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
// import './styles/index.css';

import App from "./App";

const rootElement = document.getElementById("root");
const root = createRoot(rootElement);

root.render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
);
