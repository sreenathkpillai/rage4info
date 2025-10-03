import { Search, X } from 'lucide-react';
import { useContentStore } from '../store/contentStore';
import { useState, useEffect } from 'react';

export default function SearchBar() {
  const { searchQuery, setSearchQuery } = useContentStore();
  const [localQuery, setLocalQuery] = useState(searchQuery);

  useEffect(() => {
    const debounce = setTimeout(() => {
      setSearchQuery(localQuery);
    }, 300);

    return () => clearTimeout(debounce);
  }, [localQuery, setSearchQuery]);

  const clearSearch = () => {
    setLocalQuery('');
    setSearchQuery('');
  };

  return (
    <div className="search-container">
      <Search className="search-icon" size={20} />
      <input
        type="text"
        className="search-input"
        placeholder="Search content..."
        value={localQuery}
        onChange={(e) => setLocalQuery(e.target.value)}
      />
      {localQuery && (
        <button
          className="search-clear"
          onClick={clearSearch}
          aria-label="Clear search"
        >
          <X size={18} />
        </button>
      )}

      <style>{`
        .search-clear {
          position: absolute;
          right: var(--spacing-lg);
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          padding: var(--spacing-xs);
          border-radius: var(--radius-sm);
          transition: all var(--transition-fast);
        }

        .search-clear:hover {
          background: var(--bg-tertiary);
          color: var(--text-primary);
        }
      `}</style>
    </div>
  );
}