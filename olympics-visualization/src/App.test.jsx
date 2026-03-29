import { render, screen } from '@testing-library/react';
import App from './App';
import { expect, test } from 'vitest';

test('renders app header subtitle', () => {
  render(<App />);
  const subtitle = screen.getByText(/Olympics Visualization - Made with ❤️/i);
  expect(subtitle).toBeInTheDocument();
});
