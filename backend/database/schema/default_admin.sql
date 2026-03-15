-- Default Admin User Script

INSERT INTO users (
    name,
    email,
    password,
    administrator
)
VALUES (
    'admin',
    'admin@example.com',
    '$2a$12$R.Sj.7k1.7k1.7k1.7k1.Ou9q8z7x6c5v4b3n2m1l0k9j8h7g6f5', -- WARNING: CHANGE THIS HASH IMMEDIATELY AFTER INSTALL
    TRUE
)
ON CONFLICT (email) DO NOTHING;
