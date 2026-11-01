-- Initialize extensions if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Log database readiness
RAISE NOTICE 'PostgreSQL initialized for Monorepo Stack';

