import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { store } from './store';
import { ErrorBoundary } from './components/common';
import { AuthProvider } from './features/auth';
import './index.css';
import App from './App.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <Provider store={store}>
        <AuthProvider>
          <App />
        </AuthProvider>
      </Provider>
    </ErrorBoundary>
  </StrictMode>
);
