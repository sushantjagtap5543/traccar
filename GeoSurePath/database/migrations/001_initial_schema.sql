-- GeoSurePath Database Schema and Triggers

-- Enable PostGIS if available (for future geospatial enhancements, though MapLibre handles most)
-- CREATE EXTENSION IF NOT EXISTS postgis;

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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

-- 2. Vehicles Table
CREATE TABLE IF NOT EXISTS vehicles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    imei VARCHAR(50) UNIQUE NOT NULL,
    traccar_device_id INTEGER UNIQUE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    model VARCHAR(100) DEFAULT 'unknown',
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Approved Devices Table
CREATE TABLE IF NOT EXISTS approved_devices (
    imei VARCHAR(50) PRIMARY KEY,
    model VARCHAR(100),
    batch VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Telemetry Table
CREATE TABLE IF NOT EXISTS telemetry (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    speed DECIMAL(10, 2),
    course DECIMAL(10, 2),
    altitude DECIMAL(10, 2),
    attributes JSONB,
    server_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    device_time TIMESTAMP
);

-- 5. Alerts Table
CREATE TABLE IF NOT EXISTS alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE,
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
    vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    result JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. Subscriptions Table
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    imei VARCHAR(50) NOT NULL,
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP NOT NULL,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- --- TRIGGERS ---

-- Trigger: Automatically generate overspeed alert if telemetry speed > limit
CREATE OR REPLACE FUNCTION check_overspeed()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.speed > 80 THEN -- Default 80 km/h, can be customized per vehicle later
        INSERT INTO alerts (vehicle_id, type, message, latitude, longitude, attributes)
        VALUES (NEW.vehicle_id, 'overspeed', 'Vehicle exceeded speed limit: ' || NEW.speed || ' km/h', NEW.latitude, NEW.longitude, NEW.attributes);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_overspeed_check
AFTER INSERT ON telemetry
FOR EACH ROW
EXECUTE FUNCTION check_overspeed();

-- Trigger: Log device binding on vehicle registration (audit)
CREATE OR REPLACE FUNCTION log_device_binding()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO command_logs (vehicle_id, type, status, result)
    VALUES (NEW.id, 'device_binding', 'success', jsonb_build_object('imei', NEW.imei, 'traccar_id', NEW.traccar_device_id));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_device_binding_log
AFTER INSERT ON vehicles
FOR EACH ROW
EXECUTE FUNCTION log_device_binding();
