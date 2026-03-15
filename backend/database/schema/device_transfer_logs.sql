CREATE TABLE device_transfer_logs (
    id SERIAL PRIMARY KEY,
    device_id BIGINT NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
    from_client UUID REFERENCES clients(id),
    to_client UUID REFERENCES clients(id),
    transferred_by BIGINT REFERENCES users(id),
    transfer_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
