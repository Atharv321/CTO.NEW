import { Container, Title, Text, Button, Stack } from '@mantine/core';
import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <Container size="md" py="xl">
      <Stack gap="lg" align="center">
        <Title order={1}>404 - Page Not Found</Title>
        <Text size="lg">The page you are looking for does not exist.</Text>
        <Button component={Link} to="/" size="lg">
          Go Home
        </Button>
      </Stack>
    </Container>
  );
}
