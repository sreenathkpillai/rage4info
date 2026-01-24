import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import type { Tab } from '../../../shared/types';
import { useContentStore } from '../store/contentStore';
import clsx from 'clsx';

interface MobileTabNavProps {
  tabs: Tab[];
}

export default function MobileTabNav({ tabs }: MobileTabNavProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const { currentTabId, setCurrentTab } = useContentStore();

  const visibleTabs = tabs.filter(tab => tab.visible).sort((a, b) => a.order - b.order);
  const currentTab = visibleTabs.find(tab => tab.id === currentTabId);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Close dropdown on escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
        buttonRef.current?.focus();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => {
        document.removeEventListener('keydown', handleEscape);
      };
    }
  }, [isOpen]);

  const handleTabSelect = (tabId: string) => {
    setCurrentTab(tabId);
    setIsOpen(false);
  };

  const handleKeyDown = (event: React.KeyboardEvent, tabId?: string) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (tabId) {
        handleTabSelect(tabId);
      } else {
        setIsOpen(!isOpen);
      }
    }
  };

  if (visibleTabs.length === 0) {
    return null;
  }

  return (
    <div className="mobile-tab-nav">
      <button
        ref={buttonRef}
        className={clsx('mobile-tab-button', { 'is-open': isOpen })}
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={(e) => handleKeyDown(e)}
        aria-expanded={isOpen}
        aria-controls="mobile-tab-dropdown"
        aria-haspopup="true"
        aria-label="Navigation menu"
      >
        <div className="mobile-tab-button-content">
          {currentTab?.icon && (
            <span className="mobile-tab-icon" aria-hidden="true">
              {currentTab.icon}
            </span>
          )}
          <span className="mobile-tab-title">
            {currentTab?.title || 'Select Tab'}
          </span>
        </div>
        <div className="mobile-tab-chevron" aria-hidden="true">
          {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </div>
      </button>

      <div
        ref={dropdownRef}
        id="mobile-tab-dropdown"
        className={clsx('mobile-tab-dropdown', { 'is-open': isOpen })}
        role="menu"
        aria-hidden={!isOpen}
      >
        {visibleTabs.map((tab) => (
          <button
            key={tab.id}
            className={clsx('mobile-tab-option', {
              'is-current': currentTabId === tab.id
            })}
            onClick={() => handleTabSelect(tab.id)}
            onKeyDown={(e) => handleKeyDown(e, tab.id)}
            role="menuitem"
            aria-current={currentTabId === tab.id ? 'page' : undefined}
          >
            {tab.icon && (
              <span className="mobile-tab-option-icon" aria-hidden="true">
                {tab.icon}
              </span>
            )}
            <span className="mobile-tab-option-title">
              {tab.title}
            </span>
          </button>
        ))}
      </div>

      {/* Overlay to capture clicks when dropdown is open */}
      {isOpen && (
        <div
          className="mobile-tab-overlay"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      <style>{`
        .mobile-tab-nav {
          position: relative;
          margin-bottom: 16px;
        }

        .mobile-tab-button {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          min-height: 44px;
          padding: 12px 16px;
          border: 2px solid var(--border-color);
          border-radius: 8px;
          background-color: var(--bg-primary);
          color: var(--text-primary);
          font-size: 16px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          outline: none;
        }

        .mobile-tab-button:hover {
          background-color: var(--bg-secondary);
          border-color: var(--text-muted);
        }

        .mobile-tab-button:focus {
          border-color: var(--brand-primary);
          box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.25);
        }

        .mobile-tab-button.is-open {
          border-color: var(--brand-primary);
          background-color: var(--bg-secondary);
        }

        .mobile-tab-button-content {
          display: flex;
          align-items: center;
          gap: 8px;
          flex: 1;
          text-align: left;
        }

        .mobile-tab-icon {
          display: flex;
          align-items: center;
          font-size: 18px;
        }

        .mobile-tab-title {
          font-size: 16px;
          font-weight: 500;
        }

        .mobile-tab-chevron {
          display: flex;
          align-items: center;
          color: var(--text-muted);
          transition: transform 0.2s ease;
        }

        .mobile-tab-button.is-open .mobile-tab-chevron {
          transform: rotate(180deg);
        }

        .mobile-tab-dropdown {
          position: absolute;
          top: calc(100% + 4px);
          left: 0;
          right: 0;
          background-color: var(--bg-primary);
          border: 1px solid var(--border-color);
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          z-index: 1000;
          max-height: 0;
          overflow: hidden;
          transition: all 0.2s ease;
          opacity: 0;
          transform: translateY(-8px);
        }

        .mobile-tab-dropdown.is-open {
          max-height: 300px;
          opacity: 1;
          transform: translateY(0);
        }

        .mobile-tab-option {
          display: flex;
          align-items: center;
          gap: 12px;
          width: 100%;
          min-height: 44px;
          padding: 12px 16px;
          border: none;
          background-color: var(--bg-primary);
          color: var(--text-primary);
          font-size: 16px;
          text-align: left;
          cursor: pointer;
          transition: background-color 0.15s ease;
          outline: none;
          border-bottom: 1px solid var(--border-color);
        }

        .mobile-tab-option:last-child {
          border-bottom: none;
        }

        .mobile-tab-option:hover {
          background-color: var(--bg-secondary);
        }

        .mobile-tab-option:focus {
          background-color: var(--bg-tertiary);
          box-shadow: inset 2px 0 0 var(--brand-primary);
        }

        .mobile-tab-option.is-current {
          background-color: var(--bg-tertiary);
          color: var(--brand-primary);
          font-weight: 600;
        }

        .mobile-tab-option.is-current::before {
          content: '';
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 3px;
          background-color: #007bff;
        }

        .mobile-tab-option-icon {
          display: flex;
          align-items: center;
          font-size: 18px;
        }

        .mobile-tab-option-title {
          flex: 1;
        }

        .mobile-tab-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 999;
          background-color: transparent;
        }

        /* Caregiver theme styles */
        .caregiver-header ~ .info-container .mobile-tab-button {
          border-color: #e31837;
        }

        .caregiver-header ~ .info-container .mobile-tab-button:hover {
          border-color: #c41e3a;
        }

        .caregiver-header ~ .info-container .mobile-tab-button:focus {
          border-color: #e31837;
          box-shadow: 0 0 0 2px rgba(227, 24, 55, 0.25);
        }

        .caregiver-header ~ .info-container .mobile-tab-option.is-current {
          background-color: #fdf2f2;
          color: #e31837;
        }

        .caregiver-header ~ .info-container .mobile-tab-option:focus {
          background-color: #fdf2f2;
          box-shadow: inset 2px 0 0 #e31837;
        }

        /* Care recipient theme styles */
        .recipient-header ~ .info-container .mobile-tab-button {
          border-color: #26b6ca;
        }

        .recipient-header ~ .info-container .mobile-tab-button:hover {
          border-color: #1a9db0;
        }

        .recipient-header ~ .info-container .mobile-tab-button:focus {
          border-color: #26b6ca;
          box-shadow: 0 0 0 2px rgba(38, 182, 202, 0.25);
        }

        .recipient-header ~ .info-container .mobile-tab-option.is-current {
          background-color: #f0fbfc;
          color: #26b6ca;
        }

        .recipient-header ~ .info-container .mobile-tab-option:focus {
          background-color: #f0fbfc;
          box-shadow: inset 2px 0 0 #26b6ca;
        }

        /* Animation for smooth height transition */
        @keyframes dropdownSlide {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .mobile-tab-dropdown.is-open {
          animation: dropdownSlide 0.2s ease forwards;
        }
      `}</style>
    </div>
  );
}