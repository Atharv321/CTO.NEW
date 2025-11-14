-- Create roles table if not exists
CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);

-- Insert default roles
INSERT INTO roles (name, description) VALUES
  ('admin', 'Administrator with full system access'),
  ('manager', 'Manager with access to manage locations and staff'),
  ('staff', 'Staff member with access to inventory operations'),
  ('user', 'Regular user with limited access')
ON CONFLICT (name) DO NOTHING;
