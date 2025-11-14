'use client';

import {
  Box,
  CloseButton,
  Flex,
  Icon,
  Text,
  BoxProps,
  useColorModeValue,
} from '@chakra-ui/react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  FiHome,
  FiUsers,
  FiPackage,
  FiCalendar,
  FiClipboard,
} from 'react-icons/fi';
import { IconType } from 'react-icons';

interface SidebarProps extends BoxProps {
  onClose: () => void;
}

interface NavItemProps {
  icon: IconType;
  href: string;
  children: React.ReactNode;
}

const LinkItems: Array<{ name: string; icon: IconType; href: string }> = [
  { name: 'Dashboard', icon: FiHome, href: '/admin' },
  { name: 'Services', icon: FiPackage, href: '/admin/services' },
  { name: 'Barbers', icon: FiUsers, href: '/admin/barbers' },
  { name: 'Availability', icon: FiCalendar, href: '/admin/availability' },
  { name: 'Bookings', icon: FiClipboard, href: '/admin/bookings' },
];

export function AdminSidebar({ onClose, ...rest }: SidebarProps) {
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  return (
    <Box
      transition="0.3s ease"
      bg={bgColor}
      borderRight="1px"
      borderRightColor={borderColor}
      w={{ base: 'full', md: 60 }}
      pos="fixed"
      h="full"
      {...rest}
    >
      <Flex h="16" alignItems="center" mx="6" justifyContent="space-between">
        <Text fontSize="xl" fontWeight="bold" color="blue.500">
          Admin Dashboard
        </Text>
        <CloseButton display={{ base: 'flex', md: 'none' }} onClick={onClose} />
      </Flex>
      {LinkItems.map((link) => (
        <NavItem key={link.name} icon={link.icon} href={link.href}>
          {link.name}
        </NavItem>
      ))}
    </Box>
  );
}

function NavItem({ icon, href, children }: NavItemProps) {
  const pathname = usePathname();
  const isActive = pathname === href;
  const activeColor = useColorModeValue('blue.500', 'blue.200');
  const activeBg = useColorModeValue('blue.50', 'blue.900');
  const hoverBg = useColorModeValue('gray.100', 'gray.700');

  return (
    <Link href={href} style={{ textDecoration: 'none' }}>
      <Flex
        align="center"
        p="4"
        mx="4"
        borderRadius="lg"
        role="group"
        cursor="pointer"
        bg={isActive ? activeBg : 'transparent'}
        color={isActive ? activeColor : 'inherit'}
        fontWeight={isActive ? 'semibold' : 'normal'}
        _hover={{
          bg: isActive ? activeBg : hoverBg,
        }}
      >
        {icon && (
          <Icon
            mr="4"
            fontSize="20"
            as={icon}
          />
        )}
        {children}
      </Flex>
    </Link>
  );
}
