import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useContentStore } from '../store/contentStore';

// Mock the shared API client
vi.mock('../utils/api', () => ({
  API_BASE_URL: 'http://localhost:3001/api',
  api: {
    get: vi.fn(),
    put: vi.fn(),
    post: vi.fn(),
  },
}));

// Mock fetch
global.fetch = vi.fn();

describe('Content Store', () => {
  beforeEach(() => {
    // Reset the store before each test
    useContentStore.setState({
      content: null,
      currentPageId: 'caregiver',
      currentTabId: null,
      searchQuery: '',
      theme: 'light',
      loading: false,
      error: null,
    });
  });

  it('should initialize with default state', () => {
    const store = useContentStore.getState();

    expect(store.content).toBeNull();
    expect(store.currentPageId).toBe('caregiver');
    expect(store.currentTabId).toBeNull();
    expect(store.searchQuery).toBe('');
    expect(store.theme).toBe('light');
    expect(store.loading).toBe(false);
    expect(store.error).toBeNull();
  });

  it('should update current page', () => {
    // setCurrentPage only navigates to pages that exist in loaded content
    useContentStore.setState({
      content: {
        pages: {
          caregiver: { id: 'caregiver', title: 'Caregiver', description: '', tabs: [] },
          carerecipient: { id: 'carerecipient', title: 'Care Recipient', description: '', tabs: [] },
        },
      },
    });

    const { setCurrentPage } = useContentStore.getState();

    setCurrentPage('carerecipient');

    const state = useContentStore.getState();
    expect(state.currentPageId).toBe('carerecipient');
  });

  it('should ignore navigation to pages that do not exist', () => {
    const { setCurrentPage } = useContentStore.getState();

    setCurrentPage('carerecipient'); // no content loaded yet

    expect(useContentStore.getState().currentPageId).toBe('caregiver');
  });

  it('should update search query', () => {
    const { setSearchQuery } = useContentStore.getState();

    setSearchQuery('test query');

    const state = useContentStore.getState();
    expect(state.searchQuery).toBe('test query');
  });

  it('should toggle theme', () => {
    const { toggleTheme } = useContentStore.getState();

    toggleTheme();

    const state = useContentStore.getState();
    expect(state.theme).toBe('dark');

    toggleTheme();
    const newState = useContentStore.getState();
    expect(newState.theme).toBe('light');
  });

  it('should set current tab', () => {
    const { setCurrentTab } = useContentStore.getState();

    setCurrentTab('incentives');

    const state = useContentStore.getState();
    expect(state.currentTabId).toBe('incentives');
  });
});