import { Container, Title, Text, Stack } from '@mantine/core';

export function Appointments() {
  return (
    <Container size="lg" py="xl">
      <Stack>
        <Title order={1}>Appointments</Title>
        <Text>View and manage your appointments</Text>
      </Stack>
    </Container>
  );
}
