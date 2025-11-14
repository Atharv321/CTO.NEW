'use client';

import {
  Box,
  Flex,
  IconButton,
  useDisclosure,
  Drawer,
  DrawerContent,
  useColorModeValue,
} from '@chakra-ui/react';
import { HamburgerIcon } from '@chakra-ui/icons';
import { AdminSidebar } from './AdminSidebar';
import { AdminHeader } from './AdminHeader';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const bgColor = useColorModeValue('gray.50', 'gray.900');

  return (
    <Box minH="100vh" bg={bgColor}>
      <AdminSidebar
        onClose={onClose}
        display={{ base: 'none', md: 'block' }}
      />
      <Drawer
        autoFocus={false}
        isOpen={isOpen}
        placement="left"
        onClose={onClose}
        returnFocusOnClose={false}
        onOverlayClick={onClose}
        size="full"
      >
        <DrawerContent>
          <AdminSidebar onClose={onClose} />
        </DrawerContent>
      </Drawer>

      <Box ml={{ base: 0, md: 60 }} transition="0.3s ease">
        <Flex
          px={{ base: 4, md: 6 }}
          height="16"
          alignItems="center"
          bg={useColorModeValue('white', 'gray.800')}
          borderBottomWidth="1px"
          borderBottomColor={useColorModeValue('gray.200', 'gray.700')}
          justifyContent="space-between"
        >
          <IconButton
            display={{ base: 'flex', md: 'none' }}
            onClick={onOpen}
            variant="outline"
            aria-label="open menu"
            icon={<HamburgerIcon />}
          />
          <AdminHeader />
        </Flex>

        <Box p={{ base: 4, md: 6 }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
}
