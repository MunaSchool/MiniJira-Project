import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ThemeProvider } from './context/ThemeContext';
import './index.css';

const storedDensity = localStorage.getItem('mini_jira_density');
if (storedDensity === 'compact' || storedDensity === 'comfortable') {
  document.documentElement.dataset.density = storedDensity;
}

const root = document.getElementById('root');
if (!root) {
  throw new Error('Root element #root not found');
}

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <ErrorBoundary>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
