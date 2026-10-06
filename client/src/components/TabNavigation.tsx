import { useRef, useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Tab } from '../../../shared/types';
import { useContentStore } from '../store/contentStore';
import clsx from 'clsx';

interface TabNavigationProps {
  tabs: Tab[];
}

export default function TabNavigation({ tabs }: TabNavigationProps) {
  const { currentTabId, setCurrentTab } = useContentStore();
  const tabsListRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  const visibleTabs = tabs.filter(tab => tab.visible).sort((a, b) => a.order - b.order);

  // Check if arrows should be visible based on scroll position
  const checkScrollPosition = useCallback(() => {
    const container = tabsListRef.current;
    if (!container) return;

    const { scrollLeft, scrollWidth, clientWidth } = container;
    const hasOverflow = scrollWidth > clientWidth;

    setShowLeftArrow(hasOverflow && scrollLeft > 0);
    setShowRightArrow(hasOverflow && scrollLeft < scrollWidth - clientWidth - 1);
  }, []);

  // Check on mount and when tabs change
  useEffect(() => {
    checkScrollPosition();
    window.addEventListener('resize', checkScrollPosition);
    return () => window.removeEventListener('resize', checkScrollPosition);
  }, [checkScrollPosition, visibleTabs]);

  // Re-check when the tab list itself changes size (fonts loading,
  // container resizing) - window resize alone misses these.
  useEffect(() => {
    const container = tabsListRef.current;
    if (!container || typeof ResizeObserver === 'undefined') return;

    const observer = new ResizeObserver(checkScrollPosition);
    observer.observe(container);
    return () => observer.disconnect();
  }, [checkScrollPosition]);

  // Scroll left/right by a fixed amount
  const scrollLeft = () => {
    const container = tabsListRef.current;
    if (!container) return;
    container.scrollBy({ left: -200, behavior: 'smooth' });
  };

  const scrollRight = () => {
    const container = tabsListRef.current;
    if (!container) return;
    container.scrollBy({ left: 200, behavior: 'smooth' });
  };

  return (
    <div className="tabs-container tabs-with-arrows">
      {showLeftArrow && (
        <button
          className="scroll-arrow scroll-arrow-left"
          onClick={scrollLeft}
          aria-label="Scroll tabs left"
        >
          <ChevronLeft size={20} />
        </button>
      )}

      <div
        className="tabs-list"
        ref={tabsListRef}
        onScroll={checkScrollPosition}
      >
        {visibleTabs.map(tab => (
          <button
            key={tab.id}
            className={clsx('tab-button', { active: currentTabId === tab.id })}
            onClick={() => setCurrentTab(tab.id)}
          >
            {tab.icon && <span className="tab-icon">{tab.icon}</span>}
            <span>{tab.title}</span>
          </button>
        ))}
      </div>

      {showRightArrow && (
        <button
          className="scroll-arrow scroll-arrow-right"
          onClick={scrollRight}
          aria-label="Scroll tabs right"
        >
          <ChevronRight size={20} />
        </button>
      )}
    </div>
  );
}