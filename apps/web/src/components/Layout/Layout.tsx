import { AppShell, Burger, Group, Title, Button, Box } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconScissors } from '@tabler/icons-react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '@stores/useAuthStore';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [opened, { toggle }] = useDisclosure();
  const { isAuthenticated, user, logout } = useAuthStore();

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{
        width: 300,
        breakpoint: 'sm',
        collapsed: { mobile: !opened },
      }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group>
            <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
            <Group gap="xs">
              <IconScissors size={24} />
              <Title order={3}>Barber Booking</Title>
            </Group>
          </Group>
          <Group>
            {isAuthenticated ? (
              <>
                <Box>Welcome, {user?.name}</Box>
                <Button variant="subtle" onClick={logout}>
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Button component={Link} to="/login" variant="subtle">
                  Login
                </Button>
                <Button component={Link} to="/register">
                  Sign Up
                </Button>
              </>
            )}
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="md">
        <AppShell.Section>Navigation</AppShell.Section>
      </AppShell.Navbar>

      <AppShell.Main>{children}</AppShell.Main>
    </AppShell>
  );
}
