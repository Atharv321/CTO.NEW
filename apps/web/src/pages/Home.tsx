import { Container, Title, Text, Stack } from '@mantine/core';

export function Home() {
  return (
    <Container size="lg" py="xl">
      <Stack>
        <Title order={1}>Welcome to Barber Booking</Title>
        <Text size="lg">Your appointment management system</Text>
      </Stack>
    </Container>
  );
}
