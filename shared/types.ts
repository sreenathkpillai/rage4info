// Shared types for the entire application

export interface ContentItem {
  id: string;
  title: string;
  content: string;
  sources?: string;
  lastUpdated: string;
  order: number;
}

export interface Section {
  id: string;
  title: string;
  items: ContentItem[];
  order: number;
  collapsible: boolean;
  expanded?: boolean;
}

export interface Tab {
  id: string;
  title: string;
  icon?: string;
  sections: Section[];
  order: number;
  visible: boolean;
}

export interface Page {
  id: string;
  title: string;
  description: string;
  tabs: Tab[];
  theme?: 'light' | 'dark';
}

export interface ContentSchema {
  pages: {
    [pageId: string]: Page;
  };
  metadata?: {
    version: string;
    lastModified: string;
    author?: string;
  };
}

export interface User {
  id: string;
  email: string;
  role: 'admin' | 'editor' | 'viewer';
  name?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Admin panel specific types
export interface DragItem {
  type: 'tab' | 'section' | 'item';
  id: string;
  parentId?: string;
  data: Tab | Section | ContentItem;
}

export interface ContentUpdate {
  pageId: string;
  tabId?: string;
  sectionId?: string;
  itemId?: string;
  data: Partial<Page | Tab | Section | ContentItem>;
  action: 'create' | 'update' | 'delete' | 'reorder';
}