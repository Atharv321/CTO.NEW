import React from 'react';
import { AppShell, Header, Navigation, Container } from '@mantine/core';
import { Navbar } from './Navbar';
import { AppHeader } from './AppHeader';

/**
 * Props for BaseLayout component
 */
interface BaseLayoutProps {
  children: React.ReactNode;
}

/**
 * Base layout component wrapping the entire application
 * Provides consistent header, navigation, and container structure
 */
export const BaseLayout: React.FC<BaseLayoutProps> = ({ children }) => {
  const [opened, setOpened] = React.useState(false);

  return (
    <AppShell
      padding="md"
      header={{ height: 70 }}
      navbar={{ width: 300, breakpoint: 'sm', collapsed: { mobile: !opened } }}
      layout="alt"
    >
      <Header height={70} p="md">
        <AppHeader opened={opened} onToggle={() => setOpened(!opened)} />
      </Header>
      <Navigation width={{ sm: 300, lg: 300 }} p="md">
        <Navbar />
      </Navigation>
      <Container size="lg" py="xl">
        {children}
      </Container>
    </AppShell>
  );
};
