import { render, screen } from '@testing-library/react';
import App from './App';
import { expect, test } from 'vitest';

test('renders app header with filter text', () => {
  render(<App />);
  const fromElement = screen.getByText(/from/i);
  expect(fromElement).toBeInTheDocument();
});
