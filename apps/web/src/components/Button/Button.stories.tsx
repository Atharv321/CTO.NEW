import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './Button';

const meta: Meta<typeof Button> = {
  title: 'Components/Button',
  component: Button,
  args: {
    label: 'Primary action',
  },
};

type Story = StoryObj<typeof Button>;

export const Primary: Story = {
  args: {
    label: 'Primary action',
  },
};

export const Secondary: Story = {
  args: {
    label: 'Secondary action',
    variant: 'outline',
  },
};

export default meta;
