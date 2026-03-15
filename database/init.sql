CREATE TABLE IF NOT EXISTS users (
 id SERIAL PRIMARY KEY,
 name VARCHAR(128),
 email VARCHAR(128) UNIQUE,
 password VARCHAR(256),
 administrator BOOLEAN DEFAULT FALSE
);

INSERT INTO users(name,email,password,administrator)
VALUES
('admin','admin@example.com','$2a$10$hash',true);
