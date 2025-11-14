import { Button as MantineButton, ButtonProps as MantineButtonProps } from '@mantine/core';

export interface ButtonProps extends MantineButtonProps {
  label?: string;
}

export function Button({ label, children, ...props }: ButtonProps) {
  return <MantineButton {...props}>{label || children}</MantineButton>;
}
