import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './store/AuthContext';
import { SiteSettingsProvider } from './store/SiteSettingsContext';
import { ThemeProvider } from './store/ThemeContext';
import { ToastProvider } from './components/ui/Toast';
import './styles/index.css';
import './styles/pages.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <ToastProvider>
          <SiteSettingsProvider>
            <AuthProvider>
              <App />
            </AuthProvider>
          </SiteSettingsProvider>
        </ToastProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
