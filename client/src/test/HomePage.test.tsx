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

    expect(screen.getByText('Welcome to RAGE4INFO')).toBeInTheDocument();
  });

  it('should render role cards', () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    expect(screen.getByText('INFO4 Caregivers')).toBeInTheDocument();
    expect(screen.getByText('INFO4 People with Disabilities')).toBeInTheDocument();
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