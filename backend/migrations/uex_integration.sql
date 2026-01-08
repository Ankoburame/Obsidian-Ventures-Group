-- Migration pour l'intégration UEX API
-- À exécuter sur la base de données pour ajouter les colonnes nécessaires

-- Vérifier et ajouter la colonne uex_id à materials si elle n'existe pas
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name='materials' AND column_name='uex_id'
    ) THEN
        ALTER TABLE materials ADD COLUMN uex_id INTEGER UNIQUE;
        CREATE INDEX idx_materials_uex_id ON materials(uex_id);
        RAISE NOTICE 'Colonne uex_id ajoutée à materials';
    ELSE
        RAISE NOTICE 'Colonne uex_id existe déjà dans materials';
    END IF;
END $$;

-- Vérifier que la table market_prices existe avec les bonnes colonnes
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.tables 
        WHERE table_name='market_prices'
    ) THEN
        CREATE TABLE market_prices (
            id SERIAL PRIMARY KEY,
            material_id INTEGER NOT NULL UNIQUE REFERENCES materials(id) ON DELETE CASCADE,
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
            CONSTRAINT check_avg_sell_positive CHECK (avg_sell_price IS NULL OR avg_sell_price >= 0),
            CONSTRAINT check_min_buy_positive CHECK (min_buy_price IS NULL OR min_buy_price >= 0),
            CONSTRAINT check_max_sell_positive CHECK (max_sell_price IS NULL OR max_sell_price >= 0)
        );
        
        CREATE INDEX idx_market_prices_material_id ON market_prices(material_id);
        CREATE INDEX idx_market_prices_last_updated ON market_prices(last_updated);
        
        RAISE NOTICE 'Table market_prices créée';
    ELSE
        RAISE NOTICE 'Table market_prices existe déjà';
    END IF;
END $$;

-- Vérifier que la table price_snapshots existe
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.tables 
        WHERE table_name='price_snapshots'
    ) THEN
        CREATE TABLE price_snapshots (
            id SERIAL PRIMARY KEY,
            material_id INTEGER NOT NULL REFERENCES materials(id) ON DELETE CASCADE,
            avg_buy_price NUMERIC(12, 2),
            avg_sell_price NUMERIC(12, 2),
            snapshot_date DATE NOT NULL,
            created_at TIMESTAMP DEFAULT NOW(),
            CONSTRAINT uq_material_snapshot_date UNIQUE (material_id, snapshot_date)
        );
        
        CREATE INDEX idx_price_snapshots_material_id ON price_snapshots(material_id);
        CREATE INDEX idx_price_snapshots_snapshot_date ON price_snapshots(snapshot_date);
        
        RAISE NOTICE 'Table price_snapshots créée';
    ELSE
        RAISE NOTICE 'Table price_snapshots existe déjà';
    END IF;
END $$;

-- Vérifier les colonnes nécessaires dans la table locations
DO $$ 
BEGIN
    -- Vérifier full_path
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name='locations' AND column_name='full_path'
    ) THEN
        ALTER TABLE locations ADD COLUMN full_path VARCHAR(500);
        RAISE NOTICE 'Colonne full_path ajoutée à locations';
    END IF;
    
    -- Vérifier distance_from_reference
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name='locations' AND column_name='distance_from_reference'
    ) THEN
        ALTER TABLE locations ADD COLUMN distance_from_reference NUMERIC(10, 2);
        RAISE NOTICE 'Colonne distance_from_reference ajoutée à locations';
    END IF;
    
    -- Vérifier qt_time_minutes
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name='locations' AND column_name='qt_time_minutes'
    ) THEN
        ALTER TABLE locations ADD COLUMN qt_time_minutes NUMERIC(8, 2);
        RAISE NOTICE 'Colonne qt_time_minutes ajoutée à locations';
    END IF;
END $$;

-- Afficher un résumé
SELECT 
    'materials' as table_name,
    COUNT(*) as row_count,
    COUNT(uex_id) as with_uex_id
FROM materials
UNION ALL
SELECT 
    'locations' as table_name,
    COUNT(*) as row_count,
    NULL as with_uex_id
FROM locations
UNION ALL
SELECT 
    'market_prices' as table_name,
    COUNT(*) as row_count,
    NULL as with_uex_id
FROM market_prices
UNION ALL
SELECT 
    'price_snapshots' as table_name,
    COUNT(*) as row_count,
    NULL as with_uex_id
FROM price_snapshots;
