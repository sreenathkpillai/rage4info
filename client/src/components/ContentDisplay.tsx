import { ChevronDown, ChevronUp, FileText, Clock, Link as LinkIcon } from 'lucide-react';
import type { Section } from '../../../shared/types';
import { useContentStore } from '../store/contentStore';
import { useUIStore } from '../store/uiStore';
import { processLinksWithFallback, processAllLinks } from '../utils/linkHandler';
import { format } from 'date-fns';
import clsx from 'clsx';

interface ContentDisplayProps {
  sections: Section[];
}

export default function ContentDisplay({ sections }: ContentDisplayProps) {
  const { searchQuery, currentPageId } = useContentStore();
  const { toggleSection, toggleItem, isExpanded, isItemExpanded } = useUIStore();

  const handleToggleItem = (itemId: string) => {
    toggleItem(currentPageId, itemId);
  };

  const handleToggleSection = (sectionId: string) => {
    toggleSection(currentPageId, sectionId);
  };

  // Filter sections and items based on search and visibility
  const filteredSections = sections
    .filter(section => section.visible !== false) // Only show visible sections
    .map(section => {
      // Filter items by visibility first
      let visibleItems = section.items.filter(item => item.visible !== false);

      if (!searchQuery) {
        return { ...section, items: visibleItems };
      }

      // Then filter by search query
      const filteredItems = visibleItems.filter(item =>
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.content.toLowerCase().includes(searchQuery.toLowerCase())
      );

      // Show section if title matches or any items match
      if (section.title.toLowerCase().includes(searchQuery.toLowerCase()) || filteredItems.length > 0) {
        return { ...section, items: filteredItems };
      }

      return null;
    }).filter(Boolean) as Section[];

  if (filteredSections.length === 0) {
    return (
      <div className="no-results">
        <p>No content matches your search.</p>
      </div>
    );
  }

  return (
    <div className="content-display">
      {filteredSections.map(section => (
        <div key={section.id} className="content-section">
          {section.collapsible ? (
            <div
              className={clsx('section-header', { expanded: isExpanded(currentPageId, section.id) })}
              onClick={() => handleToggleSection(section.id)}
            >
              <div className="section-title">
                <span>{section.title}</span>
                <span className="section-item-count">
                  {section.items.length} items
                </span>
              </div>
              <div className="section-chevron">
                {isExpanded(currentPageId, section.id) ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
              </div>
            </div>
          ) : (
            <div className="section-title-static">
              <h2>{section.title}</h2>
            </div>
          )}

          <div className={clsx('section-content', { expanded: isExpanded(currentPageId, section.id) || !section.collapsible })}>
            {section.items.map(item => {
              const isItemExpandedState = isItemExpanded(currentPageId, item.id);
              return (
                <div key={item.id} className="content-item">
                  <div
                    className={clsx('content-item-header', { expanded: isItemExpandedState })}
                    onClick={() => handleToggleItem(item.id)}
                  >
                    <h3 className="content-item-title">
                      <FileText size={20} />
                      {item.title}
                    </h3>
                    <div className="content-item-chevron">
                      {isItemExpandedState ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </div>
                  </div>

                  <div
                    className={clsx('content-item-body', { expanded: isItemExpandedState })}
                  >
                    <div dangerouslySetInnerHTML={{ __html: processLinksWithFallback(item.content) }} />

                    {(item.sources || item.lastUpdated) && (
                      <div className="content-item-footer">
                        {item.sources && (
                          <div className="content-sources">
                            <LinkIcon size={16} />
                            <span dangerouslySetInnerHTML={{ __html: processAllLinks(item.sources) }} />
                          </div>
                        )}
                        {item.lastUpdated && (
                          <div className="content-updated">
                            <Clock size={16} />
                            <span>
                              Updated: {format(new Date(item.lastUpdated), 'MMM d, yyyy')}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      <style>{`
        .content-display {
          margin-top: calc(var(--spacing-lg) / 2);
        }

        .no-results {
          text-align: center;
          padding: var(--spacing-2xl);
          color: var(--text-muted);
        }

        .section-item-count {
          font-size: 0.875rem;
          color: var(--text-muted);
          margin-left: var(--spacing-md);
        }

        .section-title-static {
          margin-bottom: var(--spacing-lg);
        }

        .section-title-static h2 {
          color: var(--text-primary);
          font-size: 1.5rem;
        }

        .content-sources a {
          color: var(--primary-color, #007bff);
          text-decoration: underline;
          transition: color 0.2s ease;
          cursor: pointer;
        }

        .content-sources a:hover {
          color: var(--primary-hover, #0056b3);
          text-decoration: underline;
        }

        .content-sources a:visited {
          color: var(--primary-visited, #6c757d);
        }
      `}</style>
    </div>
  );
}