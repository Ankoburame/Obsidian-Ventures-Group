-- ============================================================================
-- Script pour marquer les matériaux minables/raffinables
-- À exécuter sur la DB de production
-- ============================================================================

-- Marquer tous les minerais et gems comme minables
UPDATE materials SET is_mineable = true 
WHERE LOWER(name) IN (
  -- Minerais précieux
  'quantanium', 'bexalite', 'taranite', 'savrilium', 'stileron', 'lindinium'
  
  -- Minerais communs
  'gold', 'copper', 'beryl', 'aluminum', 'titanium', 'tungsten',
  'laranite', 'agricium', 'hephaestanite', 'borase', 'corundum', 'quartz',
  
  -- Autres minerais
  'iron', 'silicon', 'tin', 'riccite',
  'torite', 'ice'
);

-- Vérifier le résultat
SELECT 
  name, 
  category, 
  is_mineable, 
  is_salvage, 
  is_trade_good 
FROM materials 
WHERE is_mineable = true
ORDER BY name;

-- Stats
SELECT 
  'Total materials' as stat, 
  COUNT(*) as count 
FROM materials
UNION ALL
SELECT 
  'Mineable materials' as stat, 
  COUNT(*) as count 
FROM materials 
WHERE is_mineable = true;