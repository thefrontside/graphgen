import { createRoot } from "react-dom/client";
import React from 'react';


function App() {
  return (
    <div style={{ fontSize: "36px", fontWeight: "bold" }}>
      Hello from React/JSX
    </div>
  );
}

function main() {
  const container = document.querySelector("#main");

  const root = createRoot(container);

  root.render(React.createElement(App));
}

addEventListener("DOMContentLoaded", () => {
  main();
});
