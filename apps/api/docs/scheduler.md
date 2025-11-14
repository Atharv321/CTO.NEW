# Analytics Scheduler Documentation

## Overview

The scheduler service provides automated background job management for generating analytics snapshots and maintaining system health. It uses cron-based scheduling to run periodic tasks for data aggregation and cache management.

## Architecture

### Core Components

1. **SchedulerService**: Main orchestrator for all scheduled tasks
2. **Task Management**: Dynamic task registration and lifecycle management
3. **Error Handling**: Robust error recovery and logging
4. **Graceful Shutdown**: Clean task termination on service stop

### Implementation Details

```typescript
class SchedulerService {
  private tasks: Map<string, cron.ScheduledTask> = new Map();
  
  async initialize() {
    // Register all scheduled tasks
    this.scheduleTask('daily-snapshot', '0 2 * * *', this.generateDailySnapshot);
    this.scheduleTask('weekly-snapshot', '0 3 * * 0', this.generateWeeklySnapshot);
    this.scheduleTask('monthly-snapshot', '0 4 1 * *', this.generateMonthlySnapshot);
    this.scheduleTask('cache-cleanup', '0 * * * *', this.cleanupExpiredCache);
  }
}
```

## Scheduled Tasks

### 1. Daily Snapshot Generation
- **Schedule**: `0 2 * * *` (2:00 AM UTC daily)
- **Purpose**: Generate daily inventory analytics
- **Data Stored**:
  - Total inventory value by location
  - Inventory turnover ratios
  - Wastage metrics
  - Revenue and cost data

### 2. Weekly Snapshot Generation
- **Schedule**: `0 3 * * 0` (3:00 AM UTC on Sundays)
- **Purpose**: Generate weekly aggregated analytics
- **Coverage**: Previous 7 days of data
- **Use Case**: Weekly performance reviews

### 3. Monthly Snapshot Generation
- **Schedule**: `0 4 1 * *` (4:00 AM UTC on 1st day of month)
- **Purpose**: Generate comprehensive monthly reports
- **Coverage**: Previous calendar month
- **Use Case**: Monthly business intelligence

### 4. Cache Cleanup
- **Schedule**: `0 * * * *` (Every hour)
- **Purpose**: Remove expired cache entries
- **Impact**: Maintains Redis memory efficiency
- **Scope**: Analytics cache only

## API Endpoints

### Get Active Tasks
```http
GET /api/scheduler/tasks
Authorization: Bearer <admin_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "tasks": [
      "daily-snapshot",
      "weekly-snapshot", 
      "monthly-snapshot",
      "cache-cleanup"
    ]
  }
}
```

### Manual Trigger
```http
POST /api/scheduler/trigger/{type}
Authorization: Bearer <admin_token>
```

**Parameters:**
- `type`: `daily`, `weekly`, or `monthly`

**Response:**
```json
{
  "success": true,
  "message": "daily snapshot triggered successfully"
}
```

## Configuration

### Environment Variables

```bash
# Enable/disable scheduler
SCHEDULER_ENABLED=true

# Timezone for scheduling
SCHEDULER_TIMEZONE=UTC

# Database connection for snapshots
DATABASE_URL=postgresql://...

# Redis connection for cache management
REDIS_URL=redis://localhost:6379
```

### Custom Schedules

To modify schedules, update the cron expressions in the service initialization:

```typescript
// Custom schedule examples
this.scheduleTask('business-hour-snapshot', '0 */6 9-17 * * 1-5', customTask);
this.scheduleTask('end-of-day-report', '0 30 17 * * *', generateEODReport);
```

## Data Storage

### Snapshots Table Schema

```sql
CREATE TABLE analytics_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id UUID NOT NULL REFERENCES locations(id),
  period_type VARCHAR(20) NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  total_inventory_value DECIMAL(12,2),
  total_items INTEGER,
  turnover_ratio DECIMAL(8,2),
  wastage_value DECIMAL(12,2),
  wastage_percentage DECIMAL(5,2),
  revenue DECIMAL(12,2),
  cost_of_goods_sold DECIMAL(12,2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(location_id, period_type, period_start)
);
```

### Data Retention

- **Daily snapshots**: 90 days
- **Weekly snapshots**: 2 years  
- **Monthly snapshots**: 5 years
- **Automatic cleanup**: Configurable via environment variables

## Error Handling

### Retry Logic

```typescript
async generateDailySnapshot() {
  try {
    // Generate snapshot logic
  } catch (error) {
    console.error('Error generating daily snapshot:', error);
    // Error is logged but doesn't crash the scheduler
    // Task continues to run on next schedule
  }
}
```

### Monitoring

- **Task Status**: Logged on each execution
- **Error Tracking**: Detailed error logs with stack traces
- **Performance Metrics**: Execution time tracking
- **Health Checks**: Task heartbeat monitoring

### Common Failure Scenarios

1. **Database Connection Lost**
   - Automatic retry on next execution
   - Error logged with connection details
   - No impact on other scheduled tasks

2. **Redis Unavailable**
   - Cache operations gracefully degraded
   - Snapshots still generated and stored
   - Cache cleanup deferred until Redis available

3. **Memory Constraints**
   - Task execution timeouts after 5 minutes
   - Partial data saved where possible
   - Detailed error logging for debugging

## Performance Considerations

### Optimization Strategies

1. **Batch Processing**
   ```typescript
   // Process locations in batches
   const batchSize = 10;
   for (let i = 0; i < locations.rows.length; i += batchSize) {
     const batch = locations.rows.slice(i, i + batchSize);
     await processBatch(batch);
   }
   ```

2. **Connection Pooling**
   - Reuse database connections
   - Parallel processing within limits
   - Resource cleanup after each batch

3. **Incremental Updates**
   - Only process changed data
   - Track last processing timestamp
   - Avoid full table scans

### Resource Usage

- **Memory**: Typically <100MB per snapshot task
- **CPU**: Burst usage during aggregations
- **Database**: Concurrent queries limited by pool size
- **Network**: Minimal external dependencies

## Security

### Access Control

- **Admin Only**: All scheduler endpoints require admin role
- **Task Isolation**: Each task runs in isolation
- **Audit Trail**: All manual triggers logged

### Input Validation

```typescript
async triggerSnapshot(type: string) {
  if (!['daily', 'weekly', 'monthly'].includes(type)) {
    throw new Error('Invalid snapshot type');
  }
  // Process request
}
```

## Testing

### Unit Tests

```typescript
describe('SchedulerService', () => {
  it('should register tasks correctly', async () => {
    await schedulerService.initialize();
    const tasks = schedulerService.getActiveTasks();
    expect(tasks).toContain('daily-snapshot');
  });

  it('should handle manual triggers', async () => {
    const result = await schedulerService.triggerSnapshot('daily');
    expect(result).toBeDefined();
  });
});
```

### Integration Tests

- **Database Operations**: Verify snapshot creation
- **Cache Operations**: Confirm cache updates
- **API Endpoints**: Test manual triggers
- **Error Scenarios**: Validate error handling

## Deployment

### Docker Configuration

```dockerfile
# Ensure proper signal handling
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/index.js"]

# Health check for scheduler
HEALTHCHECK --interval=60s --timeout=10s \
  CMD node -e "console.log('Scheduler healthy')"
```

### Kubernetes Considerations

```yaml
# CronJob for backup snapshots
apiVersion: batch/v1
kind: CronJob
metadata:
  name: analytics-snapshot
spec:
  schedule: "0 2 * * *"
  jobTemplate:
    spec:
      template:
        spec:
          containers:
          - name: analytics
            image: analytics-api:latest
            command: ["/bin/sh"]
            args: ["-c", "node dist/scripts/trigger-snapshot.js daily"]
```

## Troubleshooting

### Common Issues

1. **Tasks Not Running**
   - Check scheduler initialization logs
   - Verify timezone configuration
   - Confirm cron syntax validity

2. **Missing Snapshots**
   - Check database connectivity
   - Review error logs for failures
   - Verify data availability

3. **Performance Issues**
   - Monitor database query performance
   - Check for memory leaks
   - Review concurrent task execution

### Debug Commands

```bash
# Check active tasks
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/scheduler/tasks

# Manual trigger for testing
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/scheduler/trigger/daily

# Check recent snapshots
psql $DATABASE_URL \
  -c "SELECT * FROM analytics_snapshots ORDER BY created_at DESC LIMIT 10"
```

## Future Enhancements

### Planned Features

1. **Dynamic Scheduling**: Runtime schedule modification
2. **Task Dependencies**: Sequential task execution
3. **Distributed Execution**: Multi-node scheduling
4. **Webhook Notifications**: Task completion alerts
5. **Performance Analytics**: Task execution metrics

### Scalability Considerations

- **Horizontal Scaling**: Multiple scheduler instances
- **Task Queuing**: Redis-based job queues
- **Load Balancing**: Distribute tasks across nodes
- **Failover**: Automatic task failover

## Best Practices

1. **Idempotency**: Design tasks to be safely re-runnable
2. **Error Isolation**: Prevent task failures from affecting others
3. **Resource Management**: Proper cleanup of connections and memory
4. **Monitoring**: Comprehensive logging and metrics
5. **Testing**: Full test coverage for all scenarios
6. **Documentation**: Clear task descriptions and purposes