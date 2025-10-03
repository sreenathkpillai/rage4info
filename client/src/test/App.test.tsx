import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from '../App';

// Mock the store
vi.mock('../store/contentStore', () => ({
  useContentStore: () => ({
    loadContent: vi.fn(),
    theme: 'light',
  }),
}));

describe('App Component', () => {
  it('should render without crashing', () => {
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>
    );

    expect(screen.getByText('Care Resource Hub')).toBeInTheDocument();
  });

  it('should render navigation links', () => {
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>
    );

    expect(screen.getByText('Caregiver')).toBeInTheDocument();
    expect(screen.getByText('Care Recipient')).toBeInTheDocument();
  });

  it('should handle theme correctly', () => {
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>
    );

    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });
});