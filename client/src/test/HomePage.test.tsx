import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import HomePage from '../pages/HomePage';

describe('HomePage Component', () => {
  it('should render welcome message', () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    expect(screen.getByText('Welcome to Care Resource Hub')).toBeInTheDocument();
  });

  it('should render role cards', () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    expect(screen.getByText('For Caregivers')).toBeInTheDocument();
    expect(screen.getByText('For Care Recipients')).toBeInTheDocument();
  });

  it('should have navigation links', () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    expect(screen.getByText('Explore Caregiver Resources')).toBeInTheDocument();
    expect(screen.getByText('Explore Care Recipient Resources')).toBeInTheDocument();
  });
});