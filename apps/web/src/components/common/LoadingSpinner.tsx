import { FC } from 'react';
import { Center, Loader, LoaderProps } from '@mantine/core';

interface LoadingSpinnerProps extends LoaderProps {
  fullPage?: boolean;
}

export const LoadingSpinner: FC<LoadingSpinnerProps> = ({ fullPage, ...props }) => {
  if (fullPage) {
    return (
      <Center h="100vh">
        <Loader size="lg" {...props} />
      </Center>
    );
  }

  return <Loader {...props} />;
};
