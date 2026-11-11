import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './app/App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import './styles/globals.css';

const rootElement = document.getElementById('root') || document.getElementById('app');

if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </React.StrictMode>
  );
}

