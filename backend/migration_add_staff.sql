-- Run this once against your existing Neon database to add staff auth
-- (safe to run even if schema.sql was already applied — uses IF NOT EXISTS).
CREATE TABLE IF NOT EXISTS staff (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('administrator', 'manager')),
    created_at TIMESTAMP DEFAULT NOW()
);
