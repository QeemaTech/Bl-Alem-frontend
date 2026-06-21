import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './store/AuthContext';
import { SiteSettingsProvider } from './store/SiteSettingsContext';
import { ToastProvider } from './components/ui/Toast';
import './styles/global.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <ToastProvider>
        <SiteSettingsProvider>
          <AuthProvider>
            <App />
          </AuthProvider>
        </SiteSettingsProvider>
      </ToastProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
