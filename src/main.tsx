import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

if (window.__mark) {
  window.__mark('react_bootstrap_start');
}

const container = document.getElementById('root');
const root = createRoot(container!);

if (window.__mark) {
  window.__mark('react_create_root_done');
}

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

if (window.__mark) {
  window.__mark('react_render_called');
}