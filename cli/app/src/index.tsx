import React from 'react';
import { createRoot } from "react-dom/client";
import { Factory } from "./components/Factory/Factory.tsx";

function App() {
  return <Factory />;
}

function main() {
  const container = document.querySelector("#main");

  const root = createRoot(container);

root.render(React.createElement(App));
}

addEventListener("DOMContentLoaded", () => {
  main();
});
