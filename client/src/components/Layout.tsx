import { Outlet, Link, useLocation } from 'react-router-dom';
import { Moon, Sun, ArrowLeft, User, Heart, Settings, Home } from 'lucide-react';
import { useContentStore } from '../store/contentStore';
import clsx from 'clsx';

export default function Layout() {
  const location = useLocation();
  const { theme, toggleTheme } = useContentStore();

  const isHomePage = location.pathname === '/';
  const isAdminPage = location.pathname === '/admin';

  return (
    <div className="app-container">
      {/* Navigation Header */}
      <header className="app-header">
        <div className="header-content">
          {/* Back Button */}
          {!isHomePage && (
            <Link to="/" className="back-button">
              <ArrowLeft size={20} />
              <span>Back</span>
            </Link>
          )}

          {/* Logo/Title */}
          <div className="header-title">
            <h1>Care Resource Hub</h1>
          </div>

          {/* Right Actions */}
          <div className="header-actions">
            {/* Page Links */}
            {!isAdminPage && (
              <nav className="page-nav">
                <Link
                  to="/caregiver"
                  className={clsx('nav-link', {
                    active: location.pathname === '/caregiver'
                  })}
                >
                  <User size={18} />
                  <span>Caregiver</span>
                </Link>
                <Link
                  to="/care-recipient"
                  className={clsx('nav-link', {
                    active: location.pathname === '/care-recipient'
                  })}
                >
                  <Heart size={18} />
                  <span>Care Recipient</span>
                </Link>
              </nav>
            )}

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="theme-toggle"
              aria-label="Toggle theme"
            >
              {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            </button>

            {/* Admin Link */}
            {!isAdminPage && (
              <Link to="/admin" className="admin-link">
                <Settings size={18} />
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="app-main">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="app-footer">
        <div className="footer-content">
          <p>&copy; 2025 Care Resource Hub v2.0</p>
          <p className="footer-links">
            <Link to="/">Home</Link>
            <span>•</span>
            <Link to="/admin">Admin</Link>
            <span>•</span>
            <a href="#privacy">Privacy</a>
            <span>•</span>
            <a href="#terms">Terms</a>
          </p>
        </div>
      </footer>
    </div>
  );
}