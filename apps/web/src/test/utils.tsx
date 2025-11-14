import { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/**
 * Custom render function that wraps components with necessary providers
 */
export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) {
  return render(ui, { ...options });
}

/**
 * Utility to create a user event instance with proper setup
 */
export function createUser() {
  return userEvent.setup();
}

/**
 * Wait for async operations
 */
export function waitForAsync() {
  return new Promise(resolve => setTimeout(resolve, 0));
}

export * from '@testing-library/react';
export { userEvent };
