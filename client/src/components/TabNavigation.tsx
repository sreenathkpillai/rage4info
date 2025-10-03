import type { Tab } from '../../../shared/types';
import { useContentStore } from '../store/contentStore';
import clsx from 'clsx';

interface TabNavigationProps {
  tabs: Tab[];
}

export default function TabNavigation({ tabs }: TabNavigationProps) {
  const { currentTabId, setCurrentTab } = useContentStore();

  const visibleTabs = tabs.filter(tab => tab.visible).sort((a, b) => a.order - b.order);

  return (
    <div className="tabs-container">
      <div className="tabs-list">
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
    </div>
  );
}