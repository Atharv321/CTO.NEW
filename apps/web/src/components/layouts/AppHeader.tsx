import React from 'react';
import { Group, Burger, Title, Button, Menu, Avatar } from '@mantine/core';
import { IconLogout, IconSettings } from 'tabler-icons-react';
import { useAuthStore } from '@/stores/useAuthStore';

/**
 * Props for AppHeader component
 */
interface AppHeaderProps {
  opened: boolean;
  onToggle: () => void;
}

/**
 * Application header component
 * Displays title, user menu, and navigation toggle
 */
export const AppHeader: React.FC<AppHeaderProps> = ({ opened, onToggle }) => {
  const { isAuthenticated, user, logout } = useAuthStore();

  return (
    <Group justify="space-between" align="center" h="100%">
      <Group>
        <Burger opened={opened} onClick={onToggle} size="sm" />
        <Title order={1} size="h3">
          Barber Booking
        </Title>
      </Group>

      {isAuthenticated ? (
        <Menu shadow="md" width={200}>
          <Menu.Target>
            <Avatar
              src={user?.name?.[0]}
              alt={user?.name || 'User'}
              radius="xl"
              style={{ cursor: 'pointer' }}
            >
              {user?.name?.[0] || 'U'}
            </Avatar>
          </Menu.Target>

          <Menu.Dropdown>
            <Menu.Item disabled>
              {user?.email}
            </Menu.Item>
            <Menu.Divider />
            <Menu.Item leftSection={<IconSettings size={14} />}>
              Settings
            </Menu.Item>
            <Menu.Item
              leftSection={<IconLogout size={14} />}
              onClick={logout}
              color="red"
            >
              Logout
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>
      ) : (
        <Button variant="default" size="sm">
          Login
        </Button>
      )}
    </Group>
  );
};
