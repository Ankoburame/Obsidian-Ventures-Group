-- ============================================================================
-- Star Citizen App - Database Clean & Init Script
-- Version: 2.0
-- Date: 2026-01-06
-- 
-- ATTENTION: Ce script SUPPRIME TOUTES les données et tables existantes !
-- À utiliser UNIQUEMENT pour un fresh start.
-- ============================================================================

-- ============================================================================
-- PARTIE 1: NETTOYAGE COMPLET
-- ============================================================================

-- Désactiver les contraintes FK temporairement pour éviter les erreurs
SET session_replication_role = 'replica';

-- Drop toutes les tables dans l'ordre inverse des dépendances
DROP TABLE IF EXISTS cargo_run_materials CASCADE;
DROP TABLE IF EXISTS cargo_runs CASCADE;
DROP TABLE IF EXISTS sales CASCADE;
DROP TABLE IF EXISTS inventory_events CASCADE;
DROP TABLE IF EXISTS inventory CASCADE;
DROP TABLE IF EXISTS refining_job_materials CASCADE;
DROP TABLE IF EXISTS refining_jobs CASCADE;
DROP TABLE IF EXISTS price_snapshots CASCADE;
DROP TABLE IF EXISTS market_prices CASCADE;
DROP TABLE IF EXISTS scan_signatures CASCADE;
DROP TABLE IF EXISTS refinery_bonuses CASCADE;
DROP TABLE IF EXISTS refining_methods CASCADE;
DROP TABLE IF EXISTS refineries CASCADE;
DROP TABLE IF EXISTS locations CASCADE;
DROP TABLE IF EXISTS materials CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Drop les vues
DROP VIEW IF EXISTS inventory_with_value CASCADE;
DROP VIEW IF EXISTS user_dashboard_stats CASCADE;

-- Drop les fonctions
DROP FUNCTION IF EXISTS update_job_status() CASCADE;

-- Drop les sequences orphelines si présentes
DROP SEQUENCE IF EXISTS cargo_run_materials_id_seq CASCADE;
DROP SEQUENCE IF EXISTS cargo_runs_id_seq CASCADE;
DROP SEQUENCE IF EXISTS sales_id_seq CASCADE;
DROP SEQUENCE IF EXISTS inventory_events_id_seq CASCADE;
DROP SEQUENCE IF EXISTS inventory_id_seq CASCADE;
DROP SEQUENCE IF EXISTS refining_job_materials_id_seq CASCADE;
DROP SEQUENCE IF EXISTS refining_jobs_id_seq CASCADE;
DROP SEQUENCE IF EXISTS price_snapshots_id_seq CASCADE;
DROP SEQUENCE IF EXISTS market_prices_id_seq CASCADE;
DROP SEQUENCE IF EXISTS scan_signatures_id_seq CASCADE;
DROP SEQUENCE IF EXISTS refinery_bonuses_id_seq CASCADE;
DROP SEQUENCE IF EXISTS refining_methods_id_seq CASCADE;
DROP SEQUENCE IF EXISTS refineries_id_seq CASCADE;
DROP SEQUENCE IF EXISTS locations_id_seq CASCADE;
DROP SEQUENCE IF EXISTS materials_id_seq CASCADE;
DROP SEQUENCE IF EXISTS users_id_seq CASCADE;

-- Réactiver les contraintes FK
SET session_replication_role = 'origin';

COMMIT;

-- ============================================================================
-- PARTIE 2: CRÉATION DES TABLES
-- ============================================================================

-- ============================================================================
-- UTILISATEURS & AUTHENTIFICATION
-- ============================================================================

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    is_admin BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_active ON users(is_active) WHERE is_active = true;

COMMENT ON TABLE users IS 'Utilisateurs de l''application';
COMMENT ON COLUMN users.password_hash IS 'Hash bcrypt du mot de passe';

-- ============================================================================
-- DONNÉES DE RÉFÉRENCE
-- ============================================================================

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

COMMENT ON TABLE materials IS 'Matériaux disponibles (metals, ores, gases, etc.)';
COMMENT ON COLUMN materials.uex_id IS 'ID depuis UEX Corp API';

CREATE TABLE locations (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    system VARCHAR(50),
    planet VARCHAR(50),
    location VARCHAR(100),
    location_type VARCHAR(50),
    full_path TEXT,
    distance_from_reference NUMERIC(10, 2),
    qt_time_minutes NUMERIC(8, 2),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_locations_code ON locations(code);
CREATE INDEX idx_locations_type ON locations(location_type);
CREATE INDEX idx_locations_system ON locations(system);

COMMENT ON TABLE locations IS 'Locations dans le système (stations, refineries, ports)';

CREATE TABLE refineries (
    id SERIAL PRIMARY KEY,
    location_id INTEGER REFERENCES locations(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    system VARCHAR(50),
    processing_time_modifier NUMERIC(5, 2) DEFAULT 1.0,
    cost_modifier NUMERIC(5, 2) DEFAULT 1.0,
    created_at TIMESTAMP DEFAULT NOW(),
    
    CONSTRAINT check_modifiers_positive CHECK (
        processing_time_modifier > 0 AND cost_modifier > 0
    )
);

CREATE INDEX idx_refineries_location ON refineries(location_id);
CREATE INDEX idx_refineries_system ON refineries(system);

COMMENT ON TABLE refineries IS 'Raffineries disponibles pour le processing';

CREATE TABLE refining_methods (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    time_modifier NUMERIC(5, 2) DEFAULT 1.0,
    cost_modifier NUMERIC(5, 2) DEFAULT 1.0,
    yield_modifier NUMERIC(5, 2) DEFAULT 1.0,
    created_at TIMESTAMP DEFAULT NOW(),
    
    CONSTRAINT check_method_modifiers CHECK (
        time_modifier > 0 AND cost_modifier > 0 AND yield_modifier > 0
    )
);

COMMENT ON TABLE refining_methods IS 'Méthodes de raffinage (economical, optimal, etc.)';

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

COMMENT ON TABLE refinery_bonuses IS 'Bonus spécifiques par méthode et matériau';

CREATE TABLE scan_signatures (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50),
    common_locations TEXT,
    primary_materials JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE scan_signatures IS 'Signatures de scan pour les miners';

-- ============================================================================
-- MARKETPLACE
-- ============================================================================

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
    
    CONSTRAINT check_prices_positive CHECK (
        (avg_buy_price IS NULL OR avg_buy_price >= 0) AND
        (avg_sell_price IS NULL OR avg_sell_price >= 0) AND
        (min_buy_price IS NULL OR min_buy_price >= 0) AND
        (max_sell_price IS NULL OR max_sell_price >= 0)
    )
);

CREATE INDEX idx_market_prices_material ON market_prices(material_id);
CREATE INDEX idx_market_prices_updated ON market_prices(last_updated);

COMMENT ON TABLE market_prices IS 'Prix actuels du marché depuis UEX';

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

COMMENT ON TABLE price_snapshots IS 'Historique des prix (snapshots journaliers)';

-- ============================================================================
-- PRODUCTION (RAFFINERIE)
-- ============================================================================

CREATE TABLE refining_jobs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    refinery_id INTEGER REFERENCES refineries(id) ON DELETE CASCADE NOT NULL,
    
    job_type VARCHAR(20) DEFAULT 'mining' CHECK (job_type IN ('mining', 'salvage')),
    total_cost NUMERIC(12, 2) CHECK (total_cost >= 0),
    processing_time INTEGER CHECK (processing_time > 0),
    
    status VARCHAR(20) DEFAULT 'processing' CHECK (
        status IN ('processing', 'ready', 'collected', 'cancelled')
    ),
    start_time TIMESTAMP DEFAULT NOW() NOT NULL,
    end_time TIMESTAMP,
    collected_at TIMESTAMP,
    
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    CONSTRAINT check_end_after_start CHECK (end_time > start_time),
    CONSTRAINT check_collected_after_end CHECK (
        collected_at IS NULL OR collected_at >= end_time
    )
);

CREATE INDEX idx_refining_jobs_user ON refining_jobs(user_id);
CREATE INDEX idx_refining_jobs_refinery ON refining_jobs(refinery_id);
CREATE INDEX idx_refining_jobs_status ON refining_jobs(status);
CREATE INDEX idx_refining_jobs_end_time ON refining_jobs(end_time) WHERE status = 'processing';
CREATE INDEX idx_refining_jobs_created ON refining_jobs(created_at DESC);

COMMENT ON TABLE refining_jobs IS 'Jobs de raffinerie (mining/salvage)';

CREATE TABLE refining_job_materials (
    id SERIAL PRIMARY KEY,
    job_id INTEGER REFERENCES refining_jobs(id) ON DELETE CASCADE NOT NULL,
    material_id INTEGER REFERENCES materials(id) ON DELETE CASCADE NOT NULL,
    
    quantity_refined NUMERIC(12, 2) NOT NULL CHECK (quantity_refined > 0),
    unit VARCHAR(10) DEFAULT 'SCU',
    
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_job_materials_job ON refining_job_materials(job_id);
CREATE INDEX idx_job_materials_material ON refining_job_materials(material_id);

COMMENT ON TABLE refining_job_materials IS 'Matériaux contenus dans un job de raffinage';

-- ============================================================================
-- INVENTAIRE
-- ============================================================================

CREATE TABLE inventory (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    material_id INTEGER REFERENCES materials(id) ON DELETE CASCADE NOT NULL,
    
    quantity NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (quantity >= 0),
    unit VARCHAR(10) DEFAULT 'SCU',
    
    last_updated TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(user_id, material_id)
);

CREATE INDEX idx_inventory_user ON inventory(user_id);
CREATE INDEX idx_inventory_material ON inventory(material_id);
CREATE INDEX idx_inventory_quantity ON inventory(quantity) WHERE quantity > 0;

COMMENT ON TABLE inventory IS 'Stock actuel de matériaux par utilisateur';

CREATE TABLE inventory_events (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    material_id INTEGER REFERENCES materials(id) ON DELETE CASCADE NOT NULL,
    
    event_type VARCHAR(20) NOT NULL CHECK (
        event_type IN ('refining_completed', 'sale', 'adjustment', 'transfer')
    ),
    quantity_change NUMERIC(12, 2) NOT NULL,
    
    refining_job_id INTEGER REFERENCES refining_jobs(id) ON DELETE SET NULL,
    sale_id INTEGER,
    
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_inventory_events_user ON inventory_events(user_id);
CREATE INDEX idx_inventory_events_material ON inventory_events(material_id);
CREATE INDEX idx_inventory_events_type ON inventory_events(event_type);
CREATE INDEX idx_inventory_events_created ON inventory_events(created_at DESC);

COMMENT ON TABLE inventory_events IS 'Historique des mouvements d''inventaire';

-- ============================================================================
-- VENTES
-- ============================================================================

CREATE TABLE sales (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    material_id INTEGER REFERENCES materials(id) ON DELETE CASCADE NOT NULL,
    location_id INTEGER REFERENCES locations(id) ON DELETE SET NULL,
    
    quantity NUMERIC(12, 2) NOT NULL CHECK (quantity > 0),
    unit_price NUMERIC(12, 2) NOT NULL CHECK (unit_price >= 0),
    total_revenue NUMERIC(12, 2) NOT NULL CHECK (total_revenue >= 0),
    
    sold_at TIMESTAMP DEFAULT NOW(),
    notes TEXT,
    
    created_at TIMESTAMP DEFAULT NOW(),
    
    CONSTRAINT check_revenue_calculation CHECK (
        total_revenue = quantity * unit_price
    )
);

CREATE INDEX idx_sales_user ON sales(user_id);
CREATE INDEX idx_sales_material ON sales(material_id);
CREATE INDEX idx_sales_location ON sales(location_id);
CREATE INDEX idx_sales_date ON sales(sold_at DESC);

COMMENT ON TABLE sales IS 'Ventes de matériaux';

-- ============================================================================
-- COMMERCE (CARGO)
-- ============================================================================

CREATE TABLE cargo_runs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    
    run_type VARCHAR(20) DEFAULT 'mission' CHECK (run_type IN ('mission', 'trade')),
    
    origin_location_id INTEGER REFERENCES locations(id) ON DELETE SET NULL,
    destination_location_id INTEGER REFERENCES locations(id) ON DELETE SET NULL,
    
    total_investment NUMERIC(12, 2) DEFAULT 0 CHECK (total_investment >= 0),
    total_revenue NUMERIC(12, 2) DEFAULT 0 CHECK (total_revenue >= 0),
    profit NUMERIC(12, 2) DEFAULT 0,
    
    started_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP,
    
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    
    CONSTRAINT check_completed_after_started CHECK (
        completed_at IS NULL OR completed_at >= started_at
    )
);

CREATE INDEX idx_cargo_runs_user ON cargo_runs(user_id);
CREATE INDEX idx_cargo_runs_type ON cargo_runs(run_type);
CREATE INDEX idx_cargo_runs_completed ON cargo_runs(completed_at DESC);
CREATE INDEX idx_cargo_runs_started ON cargo_runs(started_at DESC);

COMMENT ON TABLE cargo_runs IS 'Runs de cargo (missions et trading)';

CREATE TABLE cargo_run_materials (
    id SERIAL PRIMARY KEY,
    cargo_run_id INTEGER REFERENCES cargo_runs(id) ON DELETE CASCADE NOT NULL,
    material_id INTEGER REFERENCES materials(id) ON DELETE CASCADE NOT NULL,
    
    quantity NUMERIC(12, 2) NOT NULL CHECK (quantity > 0),
    buy_price NUMERIC(12, 2) CHECK (buy_price IS NULL OR buy_price >= 0),
    sell_price NUMERIC(12, 2) CHECK (sell_price IS NULL OR sell_price >= 0),
    
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_cargo_materials_run ON cargo_run_materials(cargo_run_id);
CREATE INDEX idx_cargo_materials_material ON cargo_run_materials(material_id);

COMMENT ON TABLE cargo_run_materials IS 'Matériaux transportés dans un cargo run';

-- ============================================================================
-- VUES
-- ============================================================================

CREATE OR REPLACE VIEW inventory_with_value AS
SELECT 
    i.id,
    i.user_id,
    i.material_id,
    m.name as material_name,
    m.category,
    i.quantity,
    i.unit,
    mp.avg_sell_price,
    ROUND(i.quantity * COALESCE(mp.avg_sell_price, 0), 2) as estimated_value,
    i.last_updated
FROM inventory i
JOIN materials m ON i.material_id = m.id
LEFT JOIN market_prices mp ON m.id = mp.material_id
WHERE i.quantity > 0
ORDER BY estimated_value DESC;

COMMENT ON VIEW inventory_with_value IS 'Inventaire avec valeur estimée basée sur market prices';

CREATE OR REPLACE VIEW user_dashboard_stats AS
SELECT 
    u.id as user_id,
    u.username,
    
    -- Stock
    COUNT(DISTINCT i.material_id) as unique_materials_count,
    COALESCE(ROUND(SUM(i.quantity), 2), 0) as total_scu,
    COALESCE(ROUND(SUM(i.quantity * COALESCE(mp.avg_sell_price, 0)), 2), 0) as estimated_stock_value,
    
    -- Refining actif
    COUNT(DISTINCT rj.id) FILTER (WHERE rj.status = 'processing') as active_refining_jobs,
    
    -- Historique récent
    COUNT(DISTINCT rj2.id) FILTER (
        WHERE rj2.status IN ('collected', 'ready') 
        AND rj2.end_time >= NOW() - INTERVAL '7 days'
    ) as completed_jobs_7d,
    
    -- Total profits (7 derniers jours)
    COALESCE(SUM(s.total_revenue) FILTER (
        WHERE s.sold_at >= NOW() - INTERVAL '7 days'
    ), 0) as revenue_7d
    
FROM users u
LEFT JOIN inventory i ON u.id = i.user_id AND i.quantity > 0
LEFT JOIN materials m ON i.material_id = m.id
LEFT JOIN market_prices mp ON m.id = mp.material_id
LEFT JOIN refining_jobs rj ON u.id = rj.user_id
LEFT JOIN refining_jobs rj2 ON u.id = rj2.user_id
LEFT JOIN sales s ON u.id = s.user_id
WHERE u.is_active = true
GROUP BY u.id, u.username;

COMMENT ON VIEW user_dashboard_stats IS 'Stats agrégées pour le dashboard utilisateur';

-- ============================================================================
-- FONCTIONS
-- ============================================================================

CREATE OR REPLACE FUNCTION update_job_status()
RETURNS void AS $$
BEGIN
    UPDATE refining_jobs
    SET 
        status = 'ready',
        updated_at = NOW()
    WHERE status = 'processing'
    AND end_time <= NOW();
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_job_status() IS 'Met à jour les jobs de raffinerie terminés';

-- Trigger pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_materials_updated_at BEFORE UPDATE ON materials
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_refining_jobs_updated_at BEFORE UPDATE ON refining_jobs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- DONNÉES INITIALES (SEED)
-- ============================================================================

-- Utilisateur admin par défaut (mot de passe: Admin123!)
-- Hash bcrypt pour "Admin123!"
INSERT INTO users (username, email, password_hash, is_admin) VALUES
('admin', 'admin@starcitizenapp.local', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5nP3qjbVHNWYi', true)
ON CONFLICT (username) DO NOTHING;

-- ============================================================================
-- VÉRIFICATIONS
-- ============================================================================

-- Compter les tables créées
DO $$
DECLARE
    table_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO table_count
    FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_type = 'BASE TABLE';
    
    RAISE NOTICE '✅ Tables créées: %', table_count;
END $$;

-- Lister les index
DO $$
DECLARE
    index_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO index_count
    FROM pg_indexes
    WHERE schemaname = 'public';
    
    RAISE NOTICE '✅ Index créés: %', index_count;
END $$;

-- ============================================================================
-- SUCCÈS
-- ============================================================================

RAISE NOTICE '';
RAISE NOTICE '╔════════════════════════════════════════════════════════════╗';
RAISE NOTICE '║  ✅ DATABASE INITIALIZED SUCCESSFULLY                      ║';
RAISE NOTICE '╠════════════════════════════════════════════════════════════╣';
RAISE NOTICE '║  Admin user: admin                                         ║';
RAISE NOTICE '║  Admin pass: Admin123!                                     ║';
RAISE NOTICE '║                                                            ║';
RAISE NOTICE '║  Next steps:                                               ║';
RAISE NOTICE '║  1. Run seed scripts for reference data                   ║';
RAISE NOTICE '║  2. Test API connectivity                                 ║';
RAISE NOTICE '║  3. Deploy backend                                        ║';
RAISE NOTICE '╚════════════════════════════════════════════════════════════╝';

COMMIT;
