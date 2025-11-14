import { FC, ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import { Stack, NavLink as MantineNavLink } from '@mantine/core';
import { IconHome, IconCalendar, IconSettings } from '@tabler/icons-react';

interface NavItem {
  label: string;
  icon: ReactNode;
  path: string;
}

interface MainNavProps {
  onNavigate?: () => void;
}

const navItems: NavItem[] = [
  { label: 'Home', icon: <IconHome size={16} />, path: '/' },
  { label: 'Appointments', icon: <IconCalendar size={16} />, path: '/appointments' },
  { label: 'Settings', icon: <IconSettings size={16} />, path: '/settings' },
];

export const MainNav: FC<MainNavProps> = ({ onNavigate }) => {
  return (
    <Stack gap="xs">
      {navItems.map(item => (
        <MantineNavLink
          key={item.path}
          label={item.label}
          leftSection={item.icon}
          component={NavLink}
          to={item.path}
          end={item.path === '/'}
          onClick={onNavigate}
          style={({ isActive }) => (isActive ? { fontWeight: 600 } : {})}
        />
      ))}
    </Stack>
  );
};
