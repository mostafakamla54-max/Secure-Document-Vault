-- Secure Document Vault - PostgreSQL initialization
-- Set sensible default for password hashing iterations handled by Django.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Ensure the application tablespace is ready (used by Django migrations later).
SELECT 'Secure Document Vault database initialized' AS status;
