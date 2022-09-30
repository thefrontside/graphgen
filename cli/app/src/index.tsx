import "./css/global.css";
import { createRoot } from "react-dom/client";
import { Factory } from "./components/Factory/Factory";

export const container = document.querySelector("main");

const root = createRoot(container);

root.render(<Factory />);
