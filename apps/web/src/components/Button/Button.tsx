import { Button as MantineButton, ButtonProps } from '@mantine/core';

export interface CustomButtonProps extends ButtonProps {
  label: string;
}

export function Button({ label, ...props }: CustomButtonProps) {
  return <MantineButton {...props}>{label}</MantineButton>;
}
