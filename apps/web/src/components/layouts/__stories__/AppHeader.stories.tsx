import type { Meta, StoryObj } from '@storybook/react';
import { AppHeader } from '../AppHeader';
import { useAuthStore } from '@/stores/useAuthStore';

const meta: Meta<typeof AppHeader> = {
  component: AppHeader,
  title: 'Layouts/AppHeader',
  tags: ['autodocs'],
  argTypes: {
    opened: {
      control: 'boolean',
    },
    onToggle: {
      action: 'toggle',
    },
  },
};

export default meta;
type Story = StoryObj<typeof AppHeader>;

export const LoggedOut: Story = {
  args: {
    opened: false,
    onToggle: () => {},
  },
  decorators: [
    (Story) => {
      useAuthStore.setState({
        isAuthenticated: false,
        user: null,
      });
      return <Story />;
    },
  ],
};

export const LoggedIn: Story = {
  args: {
    opened: false,
    onToggle: () => {},
  },
  decorators: [
    (Story) => {
      useAuthStore.setState({
        isAuthenticated: true,
        user: {
          id: '1',
          name: 'John Doe',
          email: 'john@example.com',
        },
      });
      return <Story />;
    },
  ],
};

export const NavbarOpen: Story = {
  args: {
    opened: true,
    onToggle: () => {},
  },
};
