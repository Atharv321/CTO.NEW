-- Create notification_log table
CREATE TABLE IF NOT EXISTS notification_log (
  id SERIAL PRIMARY KEY,
  booking_id INTEGER NOT NULL,
  recipient_phone VARCHAR(20) NOT NULL,
  recipient_name VARCHAR(255) NOT NULL,
  message_type VARCHAR(50) NOT NULL DEFAULT 'booking_confirmation',
  message_template VARCHAR(100),
  message_content TEXT NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  provider VARCHAR(50) NOT NULL DEFAULT 'twilio',
  provider_message_id VARCHAR(255),
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  sent_at TIMESTAMP
);

-- Create index on booking_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_notification_log_booking_id ON notification_log(booking_id);

-- Create index on status for filtering
CREATE INDEX IF NOT EXISTS idx_notification_log_status ON notification_log(status);

-- Create index on created_at for sorting
CREATE INDEX IF NOT EXISTS idx_notification_log_created_at ON notification_log(created_at);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = CURRENT_TIMESTAMP;
   RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
CREATE TRIGGER update_notification_log_updated_at 
  BEFORE UPDATE ON notification_log 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();
