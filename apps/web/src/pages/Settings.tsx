import { Container, Title, Text, Stack } from '@mantine/core';

export function Settings() {
  return (
    <Container size="lg" py="xl">
      <Stack>
        <Title order={1}>Settings</Title>
        <Text>Configure your account preferences</Text>
      </Stack>
    </Container>
  );
}
