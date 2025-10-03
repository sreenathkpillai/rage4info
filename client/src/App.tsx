import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useContentStore } from './store/contentStore';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import CaregiverPage from './pages/CaregiverPage';
import CareRecipientPage from './pages/CareRecipientPage';
import AdminPage from './pages/AdminPage';
import LoginPage from './pages/LoginPage';
import './styles/globals.css';

function App() {
  const { loadContent, theme } = useContentStore();

  useEffect(() => {
    // Load content on app start
    loadContent();

    // Set theme
    document.documentElement.setAttribute('data-theme', theme);
  }, [loadContent, theme]);

  // Get base URL from environment for subdirectory deployment
  const basename = import.meta.env.VITE_BASE_URL || '/';

  return (
    <Router basename={basename}>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="caregiver" element={<CaregiverPage />} />
          <Route path="care-recipient" element={<CareRecipientPage />} />
          <Route path="admin" element={<AdminPage />} />
          <Route path="login" element={<LoginPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;