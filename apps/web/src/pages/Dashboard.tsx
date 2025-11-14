import React from 'react';
import { Title, Text, Stack, Card, Group, Badge, SimpleGrid } from '@mantine/core';
import { IconUsers, IconCalendar, IconBriefcase, IconTrendingUp } from 'tabler-icons-react';

/**
 * StatCard component for displaying statistics
 */
interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: string;
}

const StatCard: React.FC<StatCardProps> = ({ icon, label, value, color }) => (
  <Card withBorder p="lg" radius="md">
    <Group justify="space-between" mb="xs">
      <Text size="sm" fw={500} c="dimmed">
        {label}
      </Text>
      <span style={{ color: `var(--mantine-color-${color}-6)` }}>
        {icon}
      </span>
    </Group>
    <Group align="flex-end" gap="xs">
      <div>
        <Text fw={700} size="xl">
          {value}
        </Text>
      </div>
      <Badge color={color} variant="light" size="lg">
        +12%
      </Badge>
    </Group>
  </Card>
);

/**
 * Dashboard page - Main landing page with statistics and overview
 */
export const Dashboard: React.FC = () => {
  return (
    <Stack gap="lg">
      <div>
        <Title order={1} mb="xs">
          Welcome to Barber Booking System
        </Title>
        <Text c="dimmed">
          Manage your bookings, barbers, and customers efficiently
        </Text>
      </div>

      <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="lg">
        <StatCard
          icon={<IconCalendar size={16} />}
          label="Today's Bookings"
          value={12}
          color="blue"
        />
        <StatCard
          icon={<IconUsers size={16} />}
          label="Total Customers"
          value={148}
          color="green"
        />
        <StatCard
          icon={<IconBriefcase size={16} />}
          label="Active Barbers"
          value={5}
          color="purple"
        />
        <StatCard
          icon={<IconTrendingUp size={16} />}
          label="Revenue"
          value="$1,234"
          color="teal"
        />
      </SimpleGrid>

      <Card withBorder p="lg" radius="md">
        <Title order={2} size="h4" mb="md">
          Recent Activity
        </Title>
        <Text c="dimmed" size="sm">
          No recent activity yet. Start by creating your first booking.
        </Text>
      </Card>
    </Stack>
  );
};
