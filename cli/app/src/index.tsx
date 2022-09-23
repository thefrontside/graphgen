import './css/global.css';
import React from 'react';
import { createRoot } from "react-dom/client";
import { Factory } from "./components/Factory/Factory.tsx";

export const container = document.getElementById('main');

const root = createRoot(container);

root.render(<Factory />);
