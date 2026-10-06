import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from '../App';

// Mock the store
vi.mock('../store/contentStore', () => ({
  useContentStore: () => ({
    loadContent: vi.fn(),
    theme: 'light',
  }),
}));

// App renders its own BrowserRouter, so it must not be wrapped in another router
describe('App Component', () => {
  it('should render without crashing', () => {
    render(<App />);

    expect(screen.getByText('RAGE4INFO')).toBeInTheDocument();
  });

  it('should render navigation links', () => {
    render(<App />);

    expect(screen.getByText('Caregiver')).toBeInTheDocument();
    expect(screen.getByText('Care Recipient')).toBeInTheDocument();
  });

  it('should handle theme correctly', () => {
    render(<App />);

    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });
});
