import React from 'react';
import { NavLink, Stack } from '@mantine/core';
import { Link, useLocation } from 'react-router-dom';
import {
  IconHome2,
  IconCalendar,
  IconUsers,
  IconSettings,
  IconBriefcase,
} from 'tabler-icons-react';

/**
 * Navbar component displaying navigation links
 */
export const Navbar: React.FC = () => {
  const location = useLocation();

  const navItems = [
    { label: 'Dashboard', icon: IconHome2, href: '/' },
    { label: 'Bookings', icon: IconCalendar, href: '/bookings' },
    { label: 'Barbers', icon: IconBriefcase, href: '/barbers' },
    { label: 'Customers', icon: IconUsers, href: '/customers' },
    { label: 'Settings', icon: IconSettings, href: '/settings' },
  ];

  return (
    <Stack gap={0}>
      {navItems.map((item) => (
        <NavLink
          key={item.href}
          label={item.label}
          leftSection={<item.icon size={16} />}
          component={Link}
          to={item.href}
          active={location.pathname === item.href}
        />
      ))}
    </Stack>
  );
};
