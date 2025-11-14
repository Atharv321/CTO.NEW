import { FC, ReactNode } from 'react';
import { Group, Title } from '@mantine/core';
import { ThemeToggle } from '@components/common/ThemeToggle';

export interface MainHeaderProps {
  leftSection?: ReactNode;
}

export const MainHeader: FC<MainHeaderProps> = ({ leftSection }) => {
  return (
    <Group justify="space-between" w="100%" align="center">
      <Group align="center" gap="sm">
        {leftSection}
        <Title order={3}>Barber Booking</Title>
      </Group>
      <ThemeToggle />
    </Group>
  );
};
