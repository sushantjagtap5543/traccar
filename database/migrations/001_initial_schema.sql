-- GeoSurePath Database Schema and Triggers

-- Enable PostGIS if available (for future geospatial enhancements, though MapLibre handles most)
-- CREATE EXTENSION IF NOT EXISTS postgis;

-- 1. Clients Table (Multi-tenant)
CREATE TABLE IF NOT EXISTS clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Users Table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    name VARCHAR(255),
    email VARCHAR(255) UNIQUE,
    mobile VARCHAR(20) UNIQUE NOT NULL,
    company VARCHAR(255),
    address TEXT,
    password VARCHAR(255),
    is_otp_verified BOOLEAN DEFAULT FALSE,
    otp_code VARCHAR(10),
    otp_expires_at TIMESTAMP,
    role VARCHAR(50) DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Devices Table
CREATE TABLE IF NOT EXISTS devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    imei VARCHAR(50) UNIQUE NOT NULL,
    traccar_device_id INTEGER UNIQUE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    model VARCHAR(100) DEFAULT 'unknown',
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Approved Devices Table (keeping for registration control)
CREATE TABLE IF NOT EXISTS approved_devices (
    imei VARCHAR(50) PRIMARY KEY,
    model VARCHAR(100),
    batch VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Positions Table
CREATE TABLE IF NOT EXISTS positions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id UUID REFERENCES devices(id) ON DELETE CASCADE,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    speed DECIMAL(10, 2),
    course DECIMAL(10, 2),
    altitude DECIMAL(10, 2),
    attributes JSONB,
    server_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    device_time TIMESTAMP
);

CREATE INDEX idx_device_positions ON positions(device_id, server_time);

-- 5. Alerts Table
CREATE TABLE IF NOT EXISTS alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id UUID REFERENCES devices(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    message TEXT,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    attributes JSONB,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Command Logs Table
CREATE TABLE IF NOT EXISTS command_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id UUID REFERENCES devices(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    result JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ... (Subscriptions)

-- --- TRIGGERS ---

-- Trigger: Automatically generate overspeed alert if position speed > limit
CREATE OR REPLACE FUNCTION check_overspeed()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.speed > 80 THEN 
        INSERT INTO alerts (device_id, type, message, latitude, longitude, attributes)
        VALUES (NEW.device_id, 'overspeed', 'Vehicle exceeded speed limit: ' || NEW.speed || ' km/h', NEW.latitude, NEW.longitude, NEW.attributes);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_overspeed_check
AFTER INSERT ON positions
FOR EACH ROW
EXECUTE FUNCTION check_overspeed();

-- Trigger: Log device binding on device registration (audit)
CREATE OR REPLACE FUNCTION log_device_binding()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO command_logs (device_id, type, status, result)
    VALUES (NEW.id, 'device_binding', 'success', jsonb_build_object('imei', NEW.imei, 'traccar_id', NEW.traccar_device_id));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_device_binding_log
AFTER INSERT ON devices
FOR EACH ROW
EXECUTE FUNCTION log_device_binding();
