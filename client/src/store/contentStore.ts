import { create } from 'zustand';
import type { ContentSchema, Page, Tab, Section, ContentItem, LandingPageConfig } from '../../../shared/types';
import { mergeLandingPage } from '../utils/landingIcons';
import { api } from '../utils/api';

interface ContentState {
  // Data
  content: ContentSchema | null;
  currentPageId: string;
  currentTabId: string | null;
  searchQuery: string;
  theme: 'light' | 'dark';
  loading: boolean;
  error: string | null;

  // Actions
  loadContent: () => Promise<void>;
  saveContent: (content: ContentSchema) => Promise<boolean>;
  setCurrentPage: (pageId: string) => void;
  setCurrentTab: (tabId: string) => void;
  setSearchQuery: (query: string) => void;
  toggleTheme: () => void;

  // CRUD operations for dynamic content
  addTab: (pageId: string, tab: Tab) => Promise<void>;
  updateTab: (pageId: string, tabId: string, updates: Partial<Tab>) => Promise<void>;
  deleteTab: (pageId: string, tabId: string) => Promise<void>;
  reorderTabs: (pageId: string, dragIndex: number, hoverIndex: number) => Promise<void>;

  addSection: (pageId: string, tabId: string, section: Section) => Promise<void>;
  updateSection: (pageId: string, tabId: string, sectionId: string, updates: Partial<Section>) => Promise<void>;
  deleteSection: (pageId: string, tabId: string, sectionId: string) => Promise<void>;
  reorderSections: (pageId: string, tabId: string, dragIndex: number, hoverIndex: number) => Promise<void>;

  addContentItem: (pageId: string, tabId: string, sectionId: string, item: ContentItem) => Promise<void>;
  updateContentItem: (pageId: string, tabId: string, sectionId: string, itemId: string, updates: Partial<ContentItem>) => Promise<void>;
  deleteContentItem: (pageId: string, tabId: string, sectionId: string, itemId: string) => Promise<void>;
  reorderContentItems: (pageId: string, tabId: string, sectionId: string, dragIndex: number, hoverIndex: number) => Promise<void>;

  // Landing page operations
  updateLandingPage: (landingPage: LandingPageConfig) => Promise<void>;
}

export const useContentStore = create<ContentState>((set, get) => {
  // Saves run through a queue so edits reach the server in the order they
  // were made (the API replaces the whole document). Rapid edits coalesce:
  // a queued save is skipped when a newer snapshot has superseded it.
  let saveQueue: Promise<boolean> = Promise.resolve(true);
  let latestSnapshot: ContentSchema | null = null;

  const persist = (content: ContentSchema): Promise<boolean> => {
    latestSnapshot = content;
    const run = saveQueue
      .catch(() => false) // a failed earlier save must not block later ones
      .then(async () => {
        if (latestSnapshot !== content) return true; // superseded by a newer edit
        try {
          await api.put('/content', content);
          if (get().error) set({ error: null });
          return true;
        } catch (error: any) {
          const status = error?.response?.status;
          if (status === 401 || status === 403) {
            set({ error: 'Your login session has expired. Please log out, log back in, and repeat your last change.' });
            // Resync to what the server actually has, so the UI stops
            // showing optimistic edits that were never stored.
            try {
              const response = await api.get('/content');
              set({ content: response.data.data });
            } catch {
              // server unreachable - keep local state
            }
          } else {
            set({ error: 'Failed to save content - your latest change may not be stored' });
          }
          return false;
        }
      });
    saveQueue = run;
    return run;
  };

  // Apply an immutable update to one page, show it immediately, then save.
  const applyPageChange = async (pageId: string, change: (page: Page) => Page | null) => {
    const content = get().content;
    if (!content) return;

    const page = content.pages[pageId];
    if (!page) return;

    const newPage = change(page);
    if (!newPage) return;

    const newContent: ContentSchema = {
      ...content,
      pages: { ...content.pages, [pageId]: newPage }
    };
    set({ content: newContent });
    await persist(newContent);
  };

  const reorder = <T,>(list: T[], dragIndex: number, hoverIndex: number): T[] => {
    const result = [...list];
    const [dragged] = result.splice(dragIndex, 1);
    result.splice(hoverIndex, 0, dragged);
    return result.map((entry, index) => ({ ...entry, order: index }));
  };

  return {
    // Initial state
    content: null,
    currentPageId: 'caregiver',
    currentTabId: null,
    searchQuery: '',
    theme: (localStorage.getItem('theme') as 'light' | 'dark') || 'light',
    loading: false,
    error: null,

    // Load content from API or local file
    loadContent: async () => {
      set({ loading: true, error: null });
      try {
        // Try API first
        const response = await api.get('/content');
        const content = response.data.data;

        // Set first tab as current if not set
        const currentPageId = get().currentPageId;
        const page = content.pages[currentPageId];
        if (page && page.tabs.length > 0 && !get().currentTabId) {
          set({ currentTabId: page.tabs[0].id });
        }

        set({ content, loading: false });
      } catch (error) {
        // Fallback to local JSON
        try {
          const response = await fetch('/content.json');
          const content = await response.json();

          // Transform old format to new format if needed
          const transformedContent = transformContent(content);

          const currentPageId = get().currentPageId;
          const page = transformedContent.pages[currentPageId];
          if (page && page.tabs.length > 0 && !get().currentTabId) {
            set({ currentTabId: page.tabs[0].id });
          }

          set({ content: transformedContent, loading: false });
        } catch (fallbackError) {
          set({ error: 'Failed to load content', loading: false });
        }
      }
    },

    // Save content to API (optimistic: the UI updates immediately).
    // Returns false when the server rejected the save.
    saveContent: async (content: ContentSchema) => {
      set({ content });
      return persist(content);
    },

    // Navigation
    setCurrentPage: (pageId: string) => {
      const content = get().content;
      if (content && content.pages[pageId]) {
        const page = content.pages[pageId];
        const firstTabId = page.tabs.length > 0 ? page.tabs[0].id : null;
        set({ currentPageId: pageId, currentTabId: firstTabId });
      }
    },

    setCurrentTab: (tabId: string) => {
      set({ currentTabId: tabId });
    },

    setSearchQuery: (query: string) => {
      set({ searchQuery: query });
    },

    toggleTheme: () => {
      const newTheme = get().theme === 'light' ? 'dark' : 'light';
      localStorage.setItem('theme', newTheme);
      document.documentElement.setAttribute('data-theme', newTheme);
      set({ theme: newTheme });
    },

    // Tab CRUD operations
    addTab: async (pageId: string, tab: Tab) => {
      await applyPageChange(pageId, page => ({
        ...page,
        tabs: [...page.tabs, tab]
      }));
    },

    updateTab: async (pageId: string, tabId: string, updates: Partial<Tab>) => {
      await applyPageChange(pageId, page => {
        if (!page.tabs.some(t => t.id === tabId)) return null;
        return {
          ...page,
          tabs: page.tabs.map(t => (t.id === tabId ? { ...t, ...updates } : t))
        };
      });
    },

    deleteTab: async (pageId: string, tabId: string) => {
      await applyPageChange(pageId, page => {
        const tabs = page.tabs.filter(t => t.id !== tabId);

        // Update current tab if deleted
        if (get().currentTabId === tabId) {
          set({ currentTabId: tabs.length > 0 ? tabs[0].id : null });
        }

        return { ...page, tabs };
      });
    },

    reorderTabs: async (pageId: string, dragIndex: number, hoverIndex: number) => {
      await applyPageChange(pageId, page => ({
        ...page,
        tabs: reorder(page.tabs, dragIndex, hoverIndex)
      }));
    },

    // Section CRUD operations
    addSection: async (pageId: string, tabId: string, section: Section) => {
      await applyPageChange(pageId, page => {
        if (!page.tabs.some(t => t.id === tabId)) return null;
        return {
          ...page,
          tabs: page.tabs.map(t =>
            t.id === tabId ? { ...t, sections: [...t.sections, section] } : t
          )
        };
      });
    },

    updateSection: async (pageId: string, tabId: string, sectionId: string, updates: Partial<Section>) => {
      await applyPageChange(pageId, page => ({
        ...page,
        tabs: page.tabs.map(t =>
          t.id === tabId
            ? {
                ...t,
                sections: t.sections.map(s => (s.id === sectionId ? { ...s, ...updates } : s))
              }
            : t
        )
      }));
    },

    deleteSection: async (pageId: string, tabId: string, sectionId: string) => {
      await applyPageChange(pageId, page => ({
        ...page,
        tabs: page.tabs.map(t =>
          t.id === tabId ? { ...t, sections: t.sections.filter(s => s.id !== sectionId) } : t
        )
      }));
    },

    reorderSections: async (pageId: string, tabId: string, dragIndex: number, hoverIndex: number) => {
      await applyPageChange(pageId, page => ({
        ...page,
        tabs: page.tabs.map(t =>
          t.id === tabId ? { ...t, sections: reorder(t.sections, dragIndex, hoverIndex) } : t
        )
      }));
    },

    // Content Item CRUD operations
    addContentItem: async (pageId: string, tabId: string, sectionId: string, item: ContentItem) => {
      await applyPageChange(pageId, page => {
        const tab = page.tabs.find(t => t.id === tabId);
        if (!tab || !tab.sections.some(s => s.id === sectionId)) return null;
        return {
          ...page,
          tabs: page.tabs.map(t =>
            t.id === tabId
              ? {
                  ...t,
                  sections: t.sections.map(s =>
                    s.id === sectionId ? { ...s, items: [...s.items, item] } : s
                  )
                }
              : t
          )
        };
      });
    },

    updateContentItem: async (pageId: string, tabId: string, sectionId: string, itemId: string, updates: Partial<ContentItem>) => {
      await applyPageChange(pageId, page => ({
        ...page,
        tabs: page.tabs.map(t =>
          t.id === tabId
            ? {
                ...t,
                sections: t.sections.map(s =>
                  s.id === sectionId
                    ? {
                        ...s,
                        items: s.items.map(i =>
                          i.id === itemId
                            ? { ...i, ...updates, lastUpdated: new Date().toISOString() }
                            : i
                        )
                      }
                    : s
                )
              }
            : t
        )
      }));
    },

    deleteContentItem: async (pageId: string, tabId: string, sectionId: string, itemId: string) => {
      await applyPageChange(pageId, page => ({
        ...page,
        tabs: page.tabs.map(t =>
          t.id === tabId
            ? {
                ...t,
                sections: t.sections.map(s =>
                  s.id === sectionId ? { ...s, items: s.items.filter(i => i.id !== itemId) } : s
                )
              }
            : t
        )
      }));
    },

    reorderContentItems: async (pageId: string, tabId: string, sectionId: string, dragIndex: number, hoverIndex: number) => {
      await applyPageChange(pageId, page => ({
        ...page,
        tabs: page.tabs.map(t =>
          t.id === tabId
            ? {
                ...t,
                sections: t.sections.map(s =>
                  s.id === sectionId ? { ...s, items: reorder(s.items, dragIndex, hoverIndex) } : s
                )
              }
            : t
        )
      }));
    },

    // Replace the landing page configuration (callers pass a complete,
    // defaults-merged config - see mergeLandingPage)
    updateLandingPage: async (landingPage: LandingPageConfig) => {
      const content = get().content;
      if (!content) return;

      const updatedContent = {
        ...content,
        landingPage: mergeLandingPage(landingPage)
      };

      set({ content: updatedContent });
      await persist(updatedContent);
    }
  };
});

// Helper function to transform old content format to new format
function transformContent(oldContent: any): ContentSchema {
  const newContent: ContentSchema = {
    pages: {},
    metadata: {
      version: '2.0.0',
      lastModified: new Date().toISOString()
    }
  };

  // Transform each page type
  ['caregiver', 'carerecipient'].forEach(pageType => {
    if (!oldContent[pageType]) return;

    const tabs: Tab[] = [];
    let tabOrder = 0;

    Object.entries(oldContent[pageType]).forEach(([tabId, tabData]: [string, any]) => {
      const sections: Section[] = [];
      let sectionOrder = 0;

      if (tabData.parentHeaders) {
        tabData.parentHeaders.forEach((parent: any) => {
          const items: ContentItem[] = [];
          let itemOrder = 0;

          if (parent.childHeaders) {
            parent.childHeaders.forEach((child: any) => {
              items.push({
                id: child.id,
                title: child.title,
                content: child.content || '',
                sources: child.sources,
                lastUpdated: child.last_updated || child.lastUpdated || new Date().toISOString(),
                order: itemOrder++
              });
            });
          }

          sections.push({
            id: parent.id,
            title: parent.title,
            items,
            order: sectionOrder++,
            collapsible: true,
            expanded: false
          });
        });
      }

      tabs.push({
        id: tabId,
        title: tabData.sectionTitle || tabId,
        sections,
        order: tabOrder++,
        visible: true
      });
    });

    newContent.pages[pageType] = {
      id: pageType,
      title: pageType === 'caregiver' ? 'Caregiver Resources' : 'Care Recipient Resources',
      description: pageType === 'caregiver'
        ? 'Resources and information for caregivers'
        : 'Resources and information for care recipients',
      tabs
    };
  });

  return newContent;
}
