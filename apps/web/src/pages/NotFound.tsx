import { Container, Title, Text, Button, Stack } from '@mantine/core';
import { useNavigate } from 'react-router-dom';

export function NotFound() {
  const navigate = useNavigate();

  return (
    <Container size="lg" py="xl">
      <Stack align="center">
        <Title order={1}>404</Title>
        <Text size="lg">Page not found</Text>
        <Button onClick={() => navigate('/')}>Go back home</Button>
      </Stack>
    </Container>
  );
}
