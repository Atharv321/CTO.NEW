import { FC } from 'react';
import { ActionIcon, Tooltip } from '@mantine/core';
import { IconMoonStars, IconSun } from '@tabler/icons-react';
import { useThemeStore } from '@store/ui/themeStore';

export const ThemeToggle: FC = () => {
  const colorScheme = useThemeStore(state => state.colorScheme);
  const toggleColorScheme = useThemeStore(state => state.toggleColorScheme);
  const isDark = colorScheme === 'dark';

  return (
    <Tooltip label={isDark ? 'Switch to light mode' : 'Switch to dark mode'} withArrow>
      <ActionIcon
        variant="default"
        onClick={toggleColorScheme}
        aria-label="Toggle color scheme"
      >
        {isDark ? <IconSun size={18} /> : <IconMoonStars size={18} />}
      </ActionIcon>
    </Tooltip>
  );
};
