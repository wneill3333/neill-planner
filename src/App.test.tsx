import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from './App';

describe('App', () => {
  it('renders without crashing', () => {
    render(<App />);
    // If we get here without error, the component rendered successfully
    expect(document.body).toBeDefined();
  });

  it('displays the "Neill Planner" heading', () => {
    render(<App />);
    const heading = screen.getByRole('heading', { name: /neill planner/i, level: 1 });
    expect(heading).toBeInTheDocument();
  });

  it('displays the Franklin-Covey tagline', () => {
    render(<App />);
    const tagline = screen.getByText(/franklin-covey productivity system/i);
    expect(tagline).toBeInTheDocument();
  });

  it('displays the welcome message', () => {
    render(<App />);
    const welcome = screen.getByText(/welcome to neill planner/i);
    expect(welcome).toBeInTheDocument();
  });

  it('displays all priority levels (A, B, C, D)', () => {
    render(<App />);
    expect(screen.getByText(/a - vital/i)).toBeInTheDocument();
    expect(screen.getByText(/b - important/i)).toBeInTheDocument();
    expect(screen.getByText(/c - optional/i)).toBeInTheDocument();
    expect(screen.getByText(/d - delegate/i)).toBeInTheDocument();
  });

  it('has proper semantic structure with header and main elements', () => {
    render(<App />);
    const header = document.querySelector('header');
    const main = document.querySelector('main');
    expect(header).toBeInTheDocument();
    expect(main).toBeInTheDocument();
  });
});
