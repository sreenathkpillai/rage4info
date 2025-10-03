import { ChevronDown, ChevronUp, FileText, Clock, Link as LinkIcon } from 'lucide-react';
import type { Section } from '../../../shared/types';
import { useContentStore } from '../store/contentStore';
import { format } from 'date-fns';
import { useState } from 'react';
import clsx from 'clsx';

interface ContentDisplayProps {
  sections: Section[];
}

export default function ContentDisplay({ sections }: ContentDisplayProps) {
  const { toggleSection, searchQuery } = useContentStore();
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const toggleItem = (itemId: string) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  // Filter sections and items based on search
  const filteredSections = sections.map(section => {
    if (!searchQuery) return section;

    const filteredItems = section.items.filter(item =>
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
              className={clsx('section-header', { expanded: section.expanded })}
              onClick={() => toggleSection(section.id)}
            >
              <div className="section-title">
                <span>{section.title}</span>
                <span className="section-item-count">
                  {section.items.length} items
                </span>
              </div>
              <div className="section-chevron">
                {section.expanded ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
              </div>
            </div>
          ) : (
            <div className="section-title-static">
              <h2>{section.title}</h2>
            </div>
          )}

          <div className={clsx('section-content', { expanded: section.expanded || !section.collapsible })}>
            {section.items.map(item => {
              const isItemExpanded = expandedItems.has(item.id);
              return (
                <div key={item.id} className="content-item">
                  <div
                    className={clsx('content-item-header', { expanded: isItemExpanded })}
                    onClick={() => toggleItem(item.id)}
                  >
                    <h3 className="content-item-title">
                      <FileText size={20} />
                      {item.title}
                    </h3>
                    <div className="content-item-chevron">
                      {isItemExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </div>
                  </div>

                  <div
                    className={clsx('content-item-body', { expanded: isItemExpanded })}
                  >
                    <div dangerouslySetInnerHTML={{ __html: item.content }} />

                    {(item.sources || item.lastUpdated) && (
                      <div className="content-item-footer">
                        {item.sources && (
                          <div className="content-sources">
                            <LinkIcon size={16} />
                            <span dangerouslySetInnerHTML={{ __html: item.sources }} />
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
          margin-top: var(--spacing-lg);
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
      `}</style>
    </div>
  );
}