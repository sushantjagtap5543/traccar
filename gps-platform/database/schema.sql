-- schema.sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL
);

CREATE TABLE devices (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50),
    uniqueId VARCHAR(50) UNIQUE,
    client_id INT REFERENCES users(id)
);

CREATE TABLE positions (
    id SERIAL PRIMARY KEY,
    device_id INT REFERENCES devices(id),
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    speed DOUBLE PRECISION,
    time TIMESTAMP DEFAULT now()
);
