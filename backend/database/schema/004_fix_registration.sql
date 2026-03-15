-- Fix database schema
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='email') THEN
        ALTER TABLE users ADD COLUMN email VARCHAR(128);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='password') THEN
        ALTER TABLE users ADD COLUMN password VARCHAR(256);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='administrator') THEN
        ALTER TABLE users ADD COLUMN administrator BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- Create admin user if it doesn't exist
INSERT INTO users (name, email, password, administrator)
SELECT 'admin', 'admin@admin.com', 'admin', true
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@admin.com');
