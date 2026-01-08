-- Add Payout Tables
-- Run this to add crew payout functionality

CREATE TABLE IF NOT EXISTS payout_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    creator_id INTEGER REFERENCES users(id) ON DELETE CASCADE,  -- Alias for user_id
    sale_id INTEGER REFERENCES sales(id) ON DELETE SET NULL,
    
    -- Financial details
    total_revenue NUMERIC(12, 2) NOT NULL CHECK (total_revenue > 0),
    num_participants INTEGER NOT NULL CHECK (num_participants > 0),
    base_share NUMERIC(12, 2) NOT NULL CHECK (base_share >= 0),
    external_costs NUMERIC(12, 2) DEFAULT 0 CHECK (external_costs >= 0),
    
    -- Transfer tax
    transfer_tax_rate NUMERIC(5, 4) DEFAULT 0.005 CHECK (transfer_tax_rate >= 0 AND transfer_tax_rate < 1),
    total_tax NUMERIC(12, 2),  -- Simplified: total tax paid
    seller_tax_burden NUMERIC(12, 2),
    
    -- Final amounts
    seller_final_amount NUMERIC(12, 2),
    participant_final_amount NUMERIC(12, 2),
    
    -- Status
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
    completed_at TIMESTAMP,
    
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payout_sessions_user ON payout_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_payout_sessions_creator ON payout_sessions(creator_id);
CREATE INDEX IF NOT EXISTS idx_payout_sessions_created ON payout_sessions(created_at);

CREATE TABLE IF NOT EXISTS payout_participants (
    id SERIAL PRIMARY KEY,
    session_id INTEGER NOT NULL REFERENCES payout_sessions(id) ON DELETE CASCADE,
    
    -- Participant info
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    username VARCHAR(100) NOT NULL,
    role VARCHAR(50),  -- e.g., "Pilot", "Gunner", "Miner"
    is_seller BOOLEAN DEFAULT FALSE,
    
    -- Payment details
    amount NUMERIC(12, 2) NOT NULL CHECK (amount >= 0),  -- Simplified from share_amount
    share_amount NUMERIC(12, 2),  -- Alias for amount
    tax_paid NUMERIC(12, 2) DEFAULT 0 CHECK (tax_paid >= 0),
    
    -- Status
    paid BOOLEAN DEFAULT FALSE,
    paid_at TIMESTAMP,
    
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payout_participants_session ON payout_participants(session_id);
CREATE INDEX IF NOT EXISTS idx_payout_participants_user ON payout_participants(user_id);

-- Update user relationship if needed
-- ALTER TABLE users ADD COLUMN IF NOT EXISTS ...;

COMMENT ON TABLE payout_sessions IS 'Crew payout sessions for profit sharing with 0.5% transfer tax';
COMMENT ON TABLE payout_participants IS 'Individual participants in payout sessions';
