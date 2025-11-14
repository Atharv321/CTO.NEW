import { MantineThemeOverride } from '@mantine/core';

/**
 * Mantine theme configuration
 * Customizes the theme with brand colors and typography
 */
export const theme: MantineThemeOverride = {
  primaryColor: 'blue',
  colors: {
    // Customize brand colors
  },
  typography: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    fontFamilyMonospace: '"Courier New", Courier, monospace',
  },
  headings: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },
  components: {
    Button: {
      defaultProps: {
        radius: 'md',
      },
    },
    Input: {
      defaultProps: {
        radius: 'md',
      },
    },
    Select: {
      defaultProps: {
        radius: 'md',
      },
    },
  },
};
