import { create } from 'zustand';
import type { ContentSchema, Tab, Section, ContentItem } from '../../../shared/types';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

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
  saveContent: (content: ContentSchema) => Promise<void>;
  setCurrentPage: (pageId: string) => void;
  setCurrentTab: (tabId: string) => void;
  setSearchQuery: (query: string) => void;
  toggleTheme: () => void;

  // CRUD operations for dynamic content
  addTab: (pageId: string, tab: Tab) => Promise<void>;
  updateTab: (pageId: string, tabId: string, updates: Partial<Tab>) => Promise<void>;
  deleteTab: (pageId: string, tabId: string) => Promise<void>;
  reorderTabs: (pageId: string, tabIds: string[]) => Promise<void>;

  addSection: (pageId: string, tabId: string, section: Section) => Promise<void>;
  updateSection: (pageId: string, tabId: string, sectionId: string, updates: Partial<Section>) => Promise<void>;
  deleteSection: (pageId: string, tabId: string, sectionId: string) => Promise<void>;
  reorderSections: (pageId: string, tabId: string, sectionIds: string[]) => Promise<void>;

  addContentItem: (pageId: string, tabId: string, sectionId: string, item: ContentItem) => Promise<void>;
  updateContentItem: (pageId: string, tabId: string, sectionId: string, itemId: string, updates: Partial<ContentItem>) => Promise<void>;
  deleteContentItem: (pageId: string, tabId: string, sectionId: string, itemId: string) => Promise<void>;
  reorderContentItems: (pageId: string, tabId: string, sectionId: string, itemIds: string[]) => Promise<void>;

  // Section expand/collapse
  toggleSection: (sectionId: string) => void;
}

export const useContentStore = create<ContentState>((set, get) => ({
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
      const response = await axios.get(`${API_BASE_URL}/content`);
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

  // Save content to API
  saveContent: async (content: ContentSchema) => {
    try {
      await axios.put(`${API_BASE_URL}/content`, content);
      set({ content });
    } catch (error) {
      set({ error: 'Failed to save content' });
      throw error;
    }
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
    const content = get().content;
    if (!content) return;

    const page = content.pages[pageId];
    if (!page) return;

    page.tabs.push(tab);
    await get().saveContent(content);
    set({ content: { ...content } });
  },

  updateTab: async (pageId: string, tabId: string, updates: Partial<Tab>) => {
    const content = get().content;
    if (!content) return;

    const page = content.pages[pageId];
    if (!page) return;

    const tabIndex = page.tabs.findIndex(t => t.id === tabId);
    if (tabIndex === -1) return;

    page.tabs[tabIndex] = { ...page.tabs[tabIndex], ...updates };
    await get().saveContent(content);
    set({ content: { ...content } });
  },

  deleteTab: async (pageId: string, tabId: string) => {
    const content = get().content;
    if (!content) return;

    const page = content.pages[pageId];
    if (!page) return;

    page.tabs = page.tabs.filter(t => t.id !== tabId);

    // Update current tab if deleted
    if (get().currentTabId === tabId) {
      const newTabId = page.tabs.length > 0 ? page.tabs[0].id : null;
      set({ currentTabId: newTabId });
    }

    await get().saveContent(content);
    set({ content: { ...content } });
  },

  reorderTabs: async (pageId: string, tabIds: string[]) => {
    const content = get().content;
    if (!content) return;

    const page = content.pages[pageId];
    if (!page) return;

    const reorderedTabs = tabIds.map((id, index) => {
      const tab = page.tabs.find(t => t.id === id);
      if (tab) tab.order = index;
      return tab;
    }).filter(Boolean) as Tab[];

    page.tabs = reorderedTabs;
    await get().saveContent(content);
    set({ content: { ...content } });
  },

  // Section CRUD operations
  addSection: async (pageId: string, tabId: string, section: Section) => {
    const content = get().content;
    if (!content) return;

    const page = content.pages[pageId];
    if (!page) return;

    const tab = page.tabs.find(t => t.id === tabId);
    if (!tab) return;

    tab.sections.push(section);
    await get().saveContent(content);
    set({ content: { ...content } });
  },

  updateSection: async (pageId: string, tabId: string, sectionId: string, updates: Partial<Section>) => {
    const content = get().content;
    if (!content) return;

    const page = content.pages[pageId];
    if (!page) return;

    const tab = page.tabs.find(t => t.id === tabId);
    if (!tab) return;

    const sectionIndex = tab.sections.findIndex(s => s.id === sectionId);
    if (sectionIndex === -1) return;

    tab.sections[sectionIndex] = { ...tab.sections[sectionIndex], ...updates };
    await get().saveContent(content);
    set({ content: { ...content } });
  },

  deleteSection: async (pageId: string, tabId: string, sectionId: string) => {
    const content = get().content;
    if (!content) return;

    const page = content.pages[pageId];
    if (!page) return;

    const tab = page.tabs.find(t => t.id === tabId);
    if (!tab) return;

    tab.sections = tab.sections.filter(s => s.id !== sectionId);
    await get().saveContent(content);
    set({ content: { ...content } });
  },

  reorderSections: async (pageId: string, tabId: string, sectionIds: string[]) => {
    const content = get().content;
    if (!content) return;

    const page = content.pages[pageId];
    if (!page) return;

    const tab = page.tabs.find(t => t.id === tabId);
    if (!tab) return;

    const reorderedSections = sectionIds.map((id, index) => {
      const section = tab.sections.find(s => s.id === id);
      if (section) section.order = index;
      return section;
    }).filter(Boolean) as Section[];

    tab.sections = reorderedSections;
    await get().saveContent(content);
    set({ content: { ...content } });
  },

  // Content Item CRUD operations
  addContentItem: async (pageId: string, tabId: string, sectionId: string, item: ContentItem) => {
    const content = get().content;
    if (!content) return;

    const page = content.pages[pageId];
    if (!page) return;

    const tab = page.tabs.find(t => t.id === tabId);
    if (!tab) return;

    const section = tab.sections.find(s => s.id === sectionId);
    if (!section) return;

    section.items.push(item);
    await get().saveContent(content);
    set({ content: { ...content } });
  },

  updateContentItem: async (pageId: string, tabId: string, sectionId: string, itemId: string, updates: Partial<ContentItem>) => {
    const content = get().content;
    if (!content) return;

    const page = content.pages[pageId];
    if (!page) return;

    const tab = page.tabs.find(t => t.id === tabId);
    if (!tab) return;

    const section = tab.sections.find(s => s.id === sectionId);
    if (!section) return;

    const itemIndex = section.items.findIndex(i => i.id === itemId);
    if (itemIndex === -1) return;

    section.items[itemIndex] = { ...section.items[itemIndex], ...updates };
    await get().saveContent(content);
    set({ content: { ...content } });
  },

  deleteContentItem: async (pageId: string, tabId: string, sectionId: string, itemId: string) => {
    const content = get().content;
    if (!content) return;

    const page = content.pages[pageId];
    if (!page) return;

    const tab = page.tabs.find(t => t.id === tabId);
    if (!tab) return;

    const section = tab.sections.find(s => s.id === sectionId);
    if (!section) return;

    section.items = section.items.filter(i => i.id !== itemId);
    await get().saveContent(content);
    set({ content: { ...content } });
  },

  reorderContentItems: async (pageId: string, tabId: string, sectionId: string, itemIds: string[]) => {
    const content = get().content;
    if (!content) return;

    const page = content.pages[pageId];
    if (!page) return;

    const tab = page.tabs.find(t => t.id === tabId);
    if (!tab) return;

    const section = tab.sections.find(s => s.id === sectionId);
    if (!section) return;

    const reorderedItems = itemIds.map((id, index) => {
      const item = section.items.find(i => i.id === id);
      if (item) item.order = index;
      return item;
    }).filter(Boolean) as ContentItem[];

    section.items = reorderedItems;
    await get().saveContent(content);
    set({ content: { ...content } });
  },

  toggleSection: (sectionId: string) => {
    const content = get().content;
    if (!content) return;

    const currentPageId = get().currentPageId;
    const currentTabId = get().currentTabId;

    if (!currentTabId) return;

    const page = content.pages[currentPageId];
    if (!page) return;

    const tab = page.tabs.find(t => t.id === currentTabId);
    if (!tab) return;

    const section = tab.sections.find(s => s.id === sectionId);
    if (section) {
      section.expanded = !section.expanded;
      set({ content: { ...content } });
    }
  }
}));

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