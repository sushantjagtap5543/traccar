-- Positions Partitioning Script

-- Create partitions for the positions table by range of fixTime
-- Example for 2026

CREATE TABLE IF NOT EXISTS positions_2026 PARTITION OF positions
    FOR VALUES FROM ('2026-01-01') TO ('2027-01-01');

-- Add more partitions as needed for future years
-- CREATE TABLE IF NOT EXISTS positions_2027 PARTITION OF positions
--     FOR VALUES FROM ('2027-01-01') TO ('2028-01-01');
