CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 0. Clients Table
CREATE TABLE IF NOT EXISTS clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(128) NOT NULL,
    email VARCHAR(128) UNIQUE,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 1. Users Table (Authentication)
CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(128) NOT NULL,
    email VARCHAR(128) UNIQUE NOT NULL,
    password VARCHAR(256) NOT NULL,
    phone VARCHAR(32),
    administrator BOOLEAN DEFAULT FALSE,
    readonly BOOLEAN DEFAULT FALSE,
    disabled BOOLEAN DEFAULT FALSE,
    map VARCHAR(64),
    latitude DOUBLE PRECISION DEFAULT 0,
    longitude DOUBLE PRECISION DEFAULT 0,
    zoom INTEGER DEFAULT 0,
    otp_code VARCHAR(10),
    otp_expires_at TIMESTAMP,
    is_otp_verified BOOLEAN DEFAULT FALSE,
    role VARCHAR(50) DEFAULT 'CLIENT',
    token VARCHAR(256),
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_client_id ON users(client_id);

-- 2. Groups Table
CREATE TABLE IF NOT EXISTS groups (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(128) NOT NULL,
    groupId BIGINT REFERENCES groups(id),
    attributes JSONB
);

-- 3. Devices Table
CREATE TABLE IF NOT EXISTS devices (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(128) NOT NULL,
    uniqueId VARCHAR(128) UNIQUE NOT NULL,
    status VARCHAR(32),
    lastUpdate TIMESTAMP,
    positionId BIGINT,
    groupId BIGINT REFERENCES groups(id),
    model VARCHAR(128),
    contact VARCHAR(128),
    phone VARCHAR(128),
    category VARCHAR(128),
    disabled BOOLEAN DEFAULT FALSE,
    traccar_device_id BIGINT,
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_devices_client_id ON devices(client_id);

CREATE INDEX IF NOT EXISTS idx_devices_uniqueId ON devices(uniqueId);

-- 4. Positions Table (GPS Data)
-- Note: Partitioning will be handled in a separate script or applied to this table.
CREATE TABLE IF NOT EXISTS positions (
    id BIGSERIAL,
    protocol VARCHAR(128),
    deviceId BIGINT NOT NULL REFERENCES devices(id),
    serverTime TIMESTAMP,
    deviceTime TIMESTAMP,
    fixTime TIMESTAMP,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    altitude DOUBLE PRECISION,
    speed DOUBLE PRECISION,
    course DOUBLE PRECISION,
    accuracy DOUBLE PRECISION,
    attributes JSONB,
    PRIMARY KEY (id, fixTime)
) PARTITION BY RANGE (fixTime);

CREATE INDEX IF NOT EXISTS idx_positions_deviceId ON positions(deviceId);
CREATE INDEX IF NOT EXISTS idx_positions_time ON positions(fixTime);
CREATE INDEX IF NOT EXISTS idx_device_position ON positions(deviceId, fixTime);

-- 5. Permissions Table
CREATE TABLE IF NOT EXISTS permissions (
    userId BIGINT NOT NULL REFERENCES users(id),
    deviceId BIGINT NOT NULL REFERENCES devices(id),
    PRIMARY KEY (userId, deviceId)
);

-- 6. Geofences Table
CREATE TABLE IF NOT EXISTS geofences (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(128),
    description TEXT,
    area TEXT,
    attributes JSONB
);

-- 7. Events Table
CREATE TABLE IF NOT EXISTS events (
    id BIGSERIAL PRIMARY KEY,
    type VARCHAR(128),
    deviceId BIGINT REFERENCES devices(id),
    positionId BIGINT,
    eventTime TIMESTAMP,
    attributes JSONB
);

CREATE INDEX IF NOT EXISTS idx_events_deviceId ON events(deviceId);
CREATE INDEX IF NOT EXISTS idx_event_time ON events(eventTime);

-- 8. Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
    id BIGSERIAL PRIMARY KEY,
    type VARCHAR(128),
    attributes JSONB,
    always BOOLEAN DEFAULT FALSE
);

-- 9. User Tokens Table
CREATE TABLE IF NOT EXISTS user_tokens (
    id BIGSERIAL PRIMARY KEY,
    userId BIGINT REFERENCES users(id),
    token VARCHAR(256),
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 10. Reports Table
CREATE TABLE IF NOT EXISTS reports (
    id BIGSERIAL PRIMARY KEY,
    userId BIGINT REFERENCES users(id),
    deviceId BIGINT REFERENCES devices(id),
    reportType VARCHAR(128),
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 11. Custom Indices and Constraints (Additional from User Request)
-- Already included in table definitions above via REFERENCES and CREATE INDEX
CREATE INDEX IF NOT EXISTS idx_positions_deviceId_fixTime ON positions(deviceId, fixTime DESC);
CREATE INDEX IF NOT EXISTS idx_positions_protocol ON positions(protocol);

-- 12. Default Admin User
-- WARNING: Use a secure BCrypt hash here. Default is for demonstration only.
INSERT INTO users (name, email, password, administrator)
VALUES ('admin', 'admin@example.com', '$2a$12$R.Sj.7k1.7k1.7k1.7k1.Ou9q8z7x6c5v4b3n2m1l0k9j8h7g6f5', TRUE)
ON CONFLICT (email) DO NOTHING;
