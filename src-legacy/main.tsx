import React from 'react';
import { createRoot } from 'react-dom/client';
import LegacyApp from './LegacyApp';

const container = document.getElementById('root');
const root = createRoot(container);

root.render(
  <React.StrictMode>
    <LegacyApp />
  </React.StrictMode>
);
