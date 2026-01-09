-- ============================================================================
-- Star Citizen App - Production Database Initialization Script
-- Version: 1.0.0
-- Date: 2026-01-09
-- 
-- ATTENTION: Ce script initialise une nouvelle base de données de production
-- Exécuter UNIQUEMENT sur une base vide ou pour un reset complet
-- ============================================================================

BEGIN;

-- ============================================================================
-- PARTIE 1: NETTOYAGE (si nécessaire)
-- ============================================================================

SET session_replication_role = 'replica';

DROP TABLE IF EXISTS payout_participants CASCADE;
DROP TABLE IF EXISTS payout_sessions CASCADE;
DROP TABLE IF EXISTS cargo_run_materials CASCADE;
DROP TABLE IF EXISTS cargo_runs CASCADE;
DROP TABLE IF EXISTS sales CASCADE;
DROP TABLE IF EXISTS inventory_events CASCADE;
DROP TABLE IF EXISTS inventory CASCADE;
DROP TABLE IF EXISTS refining_job_materials CASCADE;
DROP TABLE IF EXISTS refining_jobs CASCADE;
DROP TABLE IF EXISTS price_snapshots CASCADE;
DROP TABLE IF EXISTS market_prices CASCADE;
DROP TABLE IF EXISTS refinery_bonuses CASCADE;
DROP TABLE IF EXISTS refining_methods CASCADE;
DROP TABLE IF EXISTS scan_signatures CASCADE;
DROP TABLE IF EXISTS locations CASCADE;
DROP TABLE IF EXISTS materials CASCADE;
DROP TABLE IF EXISTS users CASCADE;

DROP VIEW IF EXISTS inventory_with_value CASCADE;
DROP VIEW IF EXISTS user_dashboard_stats CASCADE;
DROP FUNCTION IF EXISTS update_job_status() CASCADE;

SET session_replication_role = 'origin';

-- ============================================================================
-- PARTIE 2: CRÉATION DES TABLES PRINCIPALES
-- ============================================================================

-- USERS
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'user',
    is_active BOOLEAN DEFAULT true,
    is_admin BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);

-- MATERIALS
CREATE TABLE materials (
    id SERIAL PRIMARY KEY,
    uex_id INTEGER UNIQUE,
    name VARCHAR(100) UNIQUE NOT NULL,
    category VARCHAR(50),
    unit VARCHAR(10) DEFAULT 'SCU',
    is_mineable BOOLEAN DEFAULT false,
    is_salvage BOOLEAN DEFAULT false,
    is_trade_good BOOLEAN DEFAULT false,
    base_value NUMERIC(12, 2),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_materials_category ON materials(category);
CREATE INDEX idx_materials_name ON materials(name);
CREATE INDEX idx_materials_uex_id ON materials(uex_id);

-- LOCATIONS
CREATE TABLE locations (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    system VARCHAR(100),
    planet VARCHAR(100),
    moon VARCHAR(100),
    location_type VARCHAR(50),
    is_available BOOLEAN DEFAULT TRUE,
    has_trade_terminals BOOLEAN DEFAULT FALSE,
    has_refinery BOOLEAN DEFAULT FALSE,
    has_shops BOOLEAN DEFAULT FALSE,
    faction VARCHAR(100),
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    full_path VARCHAR(500),
    distance_from_reference NUMERIC(10, 2),
    qt_time_minutes NUMERIC(8, 2),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_locations_code ON locations(code);
CREATE INDEX idx_locations_name ON locations(name);
CREATE INDEX idx_locations_system ON locations(system);
CREATE INDEX idx_locations_type ON locations(location_type);

-- REFINING METHODS
CREATE TABLE refining_methods (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    time_modifier NUMERIC(5, 2) DEFAULT 1.0,
    cost_modifier NUMERIC(5, 2) DEFAULT 1.0,
    yield_modifier NUMERIC(5, 2) DEFAULT 1.0,
    created_at TIMESTAMP DEFAULT NOW()
);

-- REFINERY BONUSES
CREATE TABLE refinery_bonuses (
    id SERIAL PRIMARY KEY,
    refining_method_id INTEGER REFERENCES refining_methods(id) ON DELETE CASCADE,
    material_id INTEGER REFERENCES materials(id) ON DELETE CASCADE,
    bonus_percentage NUMERIC(5, 2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(refining_method_id, material_id)
);

CREATE INDEX idx_refinery_bonuses_method ON refinery_bonuses(refining_method_id);
CREATE INDEX idx_refinery_bonuses_material ON refinery_bonuses(material_id);

-- SCAN SIGNATURES
CREATE TABLE scan_signatures (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50),
    common_locations TEXT,
    primary_materials JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- MARKET PRICES
CREATE TABLE market_prices (
    id SERIAL PRIMARY KEY,
    material_id INTEGER REFERENCES materials(id) ON DELETE CASCADE UNIQUE,
    avg_buy_price NUMERIC(12, 2),
    avg_sell_price NUMERIC(12, 2),
    min_buy_price NUMERIC(12, 2),
    max_sell_price NUMERIC(12, 2),
    best_buy_location_id INTEGER REFERENCES locations(id) ON DELETE SET NULL,
    best_sell_location_id INTEGER REFERENCES locations(id) ON DELETE SET NULL,
    available_at INTEGER DEFAULT 0,
    last_updated TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT check_avg_buy_positive CHECK (avg_buy_price IS NULL OR avg_buy_price >= 0),
    CONSTRAINT check_avg_sell_positive CHECK (avg_sell_price IS NULL OR avg_sell_price >= 0)
);

CREATE INDEX idx_market_prices_material ON market_prices(material_id);
CREATE INDEX idx_market_prices_updated ON market_prices(last_updated);

-- PRICE SNAPSHOTS
CREATE TABLE price_snapshots (
    id SERIAL PRIMARY KEY,
    material_id INTEGER REFERENCES materials(id) ON DELETE CASCADE,
    avg_buy_price NUMERIC(12, 2),
    avg_sell_price NUMERIC(12, 2),
    snapshot_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(material_id, snapshot_date)
);

CREATE INDEX idx_price_snapshots_material ON price_snapshots(material_id);
CREATE INDEX idx_price_snapshots_date ON price_snapshots(snapshot_date DESC);

-- ============================================================================
-- PARTIE 3: TABLES PRODUCTION
-- ============================================================================

-- REFINING JOBS
CREATE TABLE refining_jobs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    refinery_id INTEGER REFERENCES locations(id) ON DELETE CASCADE NOT NULL,
    job_type VARCHAR(20) DEFAULT 'mining',
    total_cost NUMERIC(12, 2),
    processing_time INTEGER,
    status VARCHAR(20) DEFAULT 'processing',
    start_time TIMESTAMP DEFAULT NOW() NOT NULL,
    end_time TIMESTAMP,
    collected_at TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_refining_jobs_user ON refining_jobs(user_id);
CREATE INDEX idx_refining_jobs_refinery ON refining_jobs(refinery_id);
CREATE INDEX idx_refining_jobs_status ON refining_jobs(status);
CREATE INDEX idx_refining_jobs_end_time ON refining_jobs(end_time);

-- REFINING JOB MATERIALS
CREATE TABLE refining_job_materials (
    id SERIAL PRIMARY KEY,
    job_id INTEGER REFERENCES refining_jobs(id) ON DELETE CASCADE NOT NULL,
    material_id INTEGER REFERENCES materials(id) ON DELETE CASCADE NOT NULL,
    quantity_refined NUMERIC(12, 2) NOT NULL,
    unit VARCHAR(10) DEFAULT 'SCU',
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_job_materials_job ON refining_job_materials(job_id);
CREATE INDEX idx_job_materials_material ON refining_job_materials(material_id);

-- INVENTORY
CREATE TABLE inventory (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    material_id INTEGER REFERENCES materials(id) ON DELETE CASCADE NOT NULL,
    quantity NUMERIC(12, 2) NOT NULL DEFAULT 0,
    unit VARCHAR(10) DEFAULT 'SCU',
    last_updated TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, material_id)
);

CREATE INDEX idx_inventory_user ON inventory(user_id);
CREATE INDEX idx_inventory_material ON inventory(material_id);

-- INVENTORY EVENTS
CREATE TABLE inventory_events (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    material_id INTEGER REFERENCES materials(id) ON DELETE CASCADE NOT NULL,
    event_type VARCHAR(20) NOT NULL,
    quantity_change NUMERIC(12, 2) NOT NULL,
    refining_job_id INTEGER REFERENCES refining_jobs(id) ON DELETE SET NULL,
    sale_id INTEGER,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_inventory_events_user ON inventory_events(user_id);
CREATE INDEX idx_inventory_events_material ON inventory_events(material_id);
CREATE INDEX idx_inventory_events_type ON inventory_events(event_type);

-- SALES
CREATE TABLE sales (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    material_id INTEGER REFERENCES materials(id) ON DELETE CASCADE NOT NULL,
    refinery_source_id INTEGER REFERENCES locations(id) ON DELETE SET NULL,
    sale_location_id INTEGER REFERENCES locations(id) ON DELETE SET NULL,
    quantity NUMERIC(12, 2) NOT NULL,
    unit_price NUMERIC(12, 2) NOT NULL,
    total_revenue NUMERIC(12, 2) NOT NULL,
    refining_cost NUMERIC(12, 2) DEFAULT 0,
    sold_at TIMESTAMP DEFAULT NOW(),
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_sales_user ON sales(user_id);
CREATE INDEX idx_sales_material ON sales(material_id);
CREATE INDEX idx_sales_location ON sales(sale_location_id);
CREATE INDEX idx_sales_date ON sales(sold_at DESC);

-- ============================================================================
-- PARTIE 4: TABLES CARGO
-- ============================================================================

-- CARGO RUNS
CREATE TABLE cargo_runs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) NOT NULL,
    commodity_name VARCHAR(255) NOT NULL,
    quantity NUMERIC(10,2) NOT NULL,
    buy_location VARCHAR(255) NOT NULL,
    buy_price NUMERIC(10,2) NOT NULL,
    sell_location VARCHAR(255) NOT NULL,
    sell_price NUMERIC(10,2) NOT NULL,
    total_cost NUMERIC(15,2) NOT NULL,
    total_revenue NUMERIC(15,2) NOT NULL,
    profit NUMERIC(15,2) NOT NULL,
    status VARCHAR(50) DEFAULT 'active',
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    delivered_at TIMESTAMP
);

CREATE INDEX idx_cargo_runs_user ON cargo_runs(user_id);
CREATE INDEX idx_cargo_runs_status ON cargo_runs(status);
CREATE INDEX idx_cargo_runs_created ON cargo_runs(created_at);

-- ============================================================================
-- PARTIE 5: TABLES PAYOUT
-- ============================================================================

-- PAYOUT SESSIONS
CREATE TABLE payout_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    creator_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    sale_id INTEGER REFERENCES sales(id) ON DELETE SET NULL,
    total_revenue NUMERIC(12, 2) NOT NULL CHECK (total_revenue > 0),
    num_participants INTEGER NOT NULL CHECK (num_participants > 0),
    base_share NUMERIC(12, 2) NOT NULL CHECK (base_share >= 0),
    external_costs NUMERIC(12, 2) DEFAULT 0 CHECK (external_costs >= 0),
    transfer_tax_rate NUMERIC(5, 4) DEFAULT 0.005 CHECK (transfer_tax_rate >= 0 AND transfer_tax_rate < 1),
    total_tax NUMERIC(12, 2),
    seller_tax_burden NUMERIC(12, 2),
    seller_final_amount NUMERIC(12, 2),
    participant_final_amount NUMERIC(12, 2),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
    completed_at TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_payout_sessions_user ON payout_sessions(user_id);
CREATE INDEX idx_payout_sessions_creator ON payout_sessions(creator_id);
CREATE INDEX idx_payout_sessions_created ON payout_sessions(created_at);

-- PAYOUT PARTICIPANTS
CREATE TABLE payout_participants (
    id SERIAL PRIMARY KEY,
    session_id INTEGER NOT NULL REFERENCES payout_sessions(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    username VARCHAR(100) NOT NULL,
    role VARCHAR(50),
    is_seller BOOLEAN DEFAULT FALSE,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount >= 0),
    share_amount NUMERIC(12, 2),
    tax_paid NUMERIC(12, 2) DEFAULT 0 CHECK (tax_paid >= 0),
    paid BOOLEAN DEFAULT FALSE,
    paid_at TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_payout_participants_session ON payout_participants(session_id);
CREATE INDEX idx_payout_participants_user ON payout_participants(user_id);

-- ============================================================================
-- PARTIE 6: DONNÉES INITIALES
-- ============================================================================

-- Admin user (password: Admin123!)
INSERT INTO users (username, email, password_hash, role, is_admin) VALUES
('admin', 'admin@starcitizenapp.local', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5nP3qjbVHNWYi', 'admin', true)
ON CONFLICT (username) DO NOTHING;

-- ============================================================================
-- PARTIE 7: COMMENTAIRES
-- ============================================================================

COMMENT ON TABLE users IS 'Application users with role-based access';
COMMENT ON TABLE materials IS 'Mineable and tradeable materials/commodities';
COMMENT ON TABLE locations IS 'Stations, outposts, and trading locations';
COMMENT ON TABLE refining_jobs IS 'User refining jobs with processing status';
COMMENT ON TABLE inventory IS 'User material inventory';
COMMENT ON TABLE sales IS 'Material sales transactions';
COMMENT ON TABLE cargo_runs IS 'Cargo trading runs with profit tracking';
COMMENT ON TABLE payout_sessions IS 'Crew payout sessions for profit sharing';
COMMENT ON TABLE payout_participants IS 'Individual participants in payout sessions';

COMMIT;

-- ============================================================================
-- RÉSUMÉ
-- ============================================================================

SELECT 'Database initialized successfully!' as status;

SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;