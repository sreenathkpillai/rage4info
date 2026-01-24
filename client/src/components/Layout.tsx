import { Outlet, Link, useLocation } from 'react-router-dom';
import { Moon, Sun, ArrowLeft, User, Heart, Settings } from 'lucide-react';
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
          {/* Row 1: Back button left, Title centered, Theme Toggle right */}
          <div className="header-row-1">
            {!isHomePage && (
              <Link to="/" className="back-button" aria-label="Go back home">
                <ArrowLeft size={20} />
              </Link>
            )}

            <Link to="/" className="header-title">
              <h1>RAGE4INFO</h1>
            </Link>

            <button
              onClick={toggleTheme}
              className="theme-toggle"
              aria-label="Toggle theme"
            >
              {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            </button>
          </div>

          {/* Row 2: Navigation group (centered) */}
          {!isAdminPage && (
            <div className="header-nav">
              <Link to="/admin" className="admin-link">
                <Settings size={18} />
              </Link>
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
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="app-main">
        <Outlet />
      </main>

{/* Footer removed - using WordPress footer instead */}
    </div>
  );
}