import React from 'react';
import { Container, Title, Text, Button, Stack, Center } from '@mantine/core';
import { Link } from 'react-router-dom';
import { IconArrowLeft } from 'tabler-icons-react';

/**
 * 404 Not Found page
 */
export const NotFound: React.FC = () => {
  return (
    <Container size="sm">
      <Center style={{ minHeight: 400 }}>
        <Stack gap="lg" align="center">
          <div style={{ textAlign: 'center' }}>
            <Title order={1} style={{ fontSize: 120, fontWeight: 900 }}>
              404
            </Title>
            <Title order={2} mb="md">
              Page Not Found
            </Title>
            <Text c="dimmed" size="lg">
              The page you are looking for does not exist. Check the URL and try
              again.
            </Text>
          </div>

          <Button
            component={Link}
            to="/"
            leftSection={<IconArrowLeft size={16} />}
            size="md"
          >
            Back to Dashboard
          </Button>
        </Stack>
      </Center>
    </Container>
  );
};
