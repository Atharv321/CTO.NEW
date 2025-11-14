import { Container, Title, Text, Button, Stack } from '@mantine/core';
import { Link } from 'react-router-dom';

export function HomePage() {
  return (
    <Container size="md" py="xl">
      <Stack gap="lg">
        <Title order={1}>Welcome to Barber Booking System</Title>
        <Text size="lg">Book your next haircut appointment with ease.</Text>
        <Button component={Link} to="/booking" size="lg" w={200}>
          Book Now
        </Button>
      </Stack>
    </Container>
  );
}
