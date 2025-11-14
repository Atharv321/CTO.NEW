'use client';

import {
  Flex,
  Button,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Avatar,
  Text,
  HStack,
  useColorModeValue,
} from '@chakra-ui/react';
import { ChevronDownIcon } from '@chakra-ui/icons';
import { useAdminAuth } from '@/contexts/AdminAuthContext';

export function AdminHeader() {
  const { user, logout } = useAdminAuth();
  const menuBg = useColorModeValue('white', 'gray.800');

  return (
    <Flex alignItems="center" justifyContent="flex-end" w="full">
      <Menu>
        <MenuButton as={Button} rightIcon={<ChevronDownIcon />} variant="ghost">
          <HStack spacing={2}>
            <Avatar size="sm" name={user?.name} />
            <Text display={{ base: 'none', md: 'block' }}>{user?.name}</Text>
          </HStack>
        </MenuButton>
        <MenuList bg={menuBg}>
          <MenuItem isDisabled>
            <Text fontSize="sm" color="gray.600">
              {user?.email}
            </Text>
          </MenuItem>
          <MenuItem onClick={logout}>Logout</MenuItem>
        </MenuList>
      </Menu>
    </Flex>
  );
}
