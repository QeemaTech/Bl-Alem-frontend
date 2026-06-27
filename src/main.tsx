import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './store/AuthContext';
import { SiteSettingsProvider } from './store/SiteSettingsContext';
import { ThemeProvider } from './store/ThemeContext';
import { ToastProvider } from './components/ui/Toast';
import './i18n';
import './styles/index.css';
import './styles/rtl-ltr.css';
import './styles/theme-bridge.css';
import './styles/pages.css';
import './styles/my-courses.css';
import './styles/student-courses.css';
import './styles/student-player.css';
import './styles/student-community.css';
import './styles/student-dashboard.css';

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
