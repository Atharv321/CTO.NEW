import { FC } from 'react';
import { AppShell, Burger, Box } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { Outlet } from 'react-router-dom';
import { MainHeader } from './MainHeader';
import { MainNav } from './MainNav';

export const MainLayout: FC = () => {
  const [opened, { toggle, close }] = useDisclosure();

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{
        width: 250,
        breakpoint: 'sm',
        collapsed: { mobile: !opened },
      }}
      padding="md"
    >
      <AppShell.Header p="md">
        <MainHeader
          leftSection={<Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />}
        />
      </AppShell.Header>

      <AppShell.Navbar p="md">
        <MainNav onNavigate={close} />
      </AppShell.Navbar>

      <AppShell.Main>
        <Box component="main">
          <Outlet />
        </Box>
      </AppShell.Main>
    </AppShell>
  );
};
