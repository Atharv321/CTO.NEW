import type { Meta, StoryObj } from '@storybook/react';
import { MainHeader } from './MainHeader';
import { Burger } from '@mantine/core';

const meta: Meta<typeof MainHeader> = {
  title: 'Layout/MainHeader',
  component: MainHeader,
  args: {
    leftSection: <Burger opened={false} />,
  },
};

type Story = StoryObj<typeof MainHeader>;

export const Default: Story = {};

export default meta;
