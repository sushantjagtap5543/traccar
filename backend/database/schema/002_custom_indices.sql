-- GeoSurePath Production Migrations
ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'CLIENT';
ALTER TABLE devices ADD COLUMN IF NOT EXISTS client_id UUID;

-- Performance Index
CREATE INDEX IF NOT EXISTS idx_positions_device_time ON positions(device_id, device_time);
