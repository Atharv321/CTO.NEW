import { ReactNode } from 'react';

export const mockProps = {
  button: {
    label: 'Click me',
    onClick: () => {},
    disabled: false,
  },
  input: {
    placeholder: 'Enter text',
    value: '',
    onChange: () => {},
  },
  card: {
    title: 'Card Title',
    description: 'Card Description',
    children: null as ReactNode,
  },
};

export function createMockProps<T>(type: keyof typeof mockProps, overrides = {}) {
  return {
    ...(mockProps[type] as T),
    ...overrides,
  };
}
