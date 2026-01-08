"""
Database Seed Script
Populates the database with initial reference data.

Usage:
    python seed.py
"""
import sys
import os

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

from sqlalchemy.orm import Session
from database import SessionLocal, engine
from models.material import Material
from models.location import Location
from models.refinery import Refinery
from models.market import MarketPrice
from decimal import Decimal


def seed_materials(db: Session):
    """Seed materials (metals, ores, gases)."""
    print("\n🔧 Seeding materials...")
    
    materials_data = [
        # METALS (Refined)
        {"name": "Aluminum", "category": "Metal", "unit": "SCU", "is_mineable": False, "is_trade_good": True, "base_value": 1.23},
        {"name": "Copper", "category": "Metal", "unit": "SCU", "is_mineable": False, "is_trade_good": True, "base_value": 6.73},
        {"name": "Gold", "category": "Metal", "unit": "SCU", "is_mineable": False, "is_trade_good": True, "base_value": 6.04},
        {"name": "Iron", "category": "Metal", "unit": "SCU", "is_mineable": False, "is_trade_good": True, "base_value": 0.41},
        {"name": "Titanium", "category": "Metal", "unit": "SCU", "is_mineable": False, "is_trade_good": True, "base_value": 8.23},
        {"name": "Tungsten", "category": "Metal", "unit": "SCU", "is_mineable": False, "is_trade_good": True, "base_value": 3.86},
        {"name": "Beryl", "category": "Metal", "unit": "SCU", "is_mineable": False, "is_trade_good": True, "base_value": 27.53},
        {"name": "Bexalite", "category": "Metal", "unit": "SCU", "is_mineable": False, "is_trade_good": True, "base_value": 42.35},
        {"name": "Taranite", "category": "Metal", "unit": "SCU", "is_mineable": False, "is_trade_good": True, "base_value": 32.84},
        {"name": "Laranite", "category": "Metal", "unit": "SCU", "is_mineable": False, "is_trade_good": True, "base_value": 30.42},
        {"name": "Quantainium", "category": "Metal", "unit": "SCU", "is_mineable": False, "is_trade_good": True, "base_value": 88.00},
        
        # ORES (Raw - Mineable)
        {"name": "Aluminum (Ore)", "category": "Ore", "unit": "cSCU", "is_mineable": True, "is_trade_good": False, "base_value": 0.62},
        {"name": "Copper (Ore)", "category": "Ore", "unit": "cSCU", "is_mineable": True, "is_trade_good": False, "base_value": 3.36},
        {"name": "Gold (Ore)", "category": "Ore", "unit": "cSCU", "is_mineable": True, "is_trade_good": False, "base_value": 3.02},
        {"name": "Iron (Ore)", "category": "Ore", "unit": "cSCU", "is_mineable": True, "is_trade_good": False, "base_value": 0.21},
        {"name": "Titanium (Ore)", "category": "Ore", "unit": "cSCU", "is_mineable": True, "is_trade_good": False, "base_value": 4.12},
        {"name": "Tungsten (Ore)", "category": "Ore", "unit": "cSCU", "is_mineable": True, "is_trade_good": False, "base_value": 1.93},
        {"name": "Beryl (Raw)", "category": "Ore", "unit": "cSCU", "is_mineable": True, "is_trade_good": False, "base_value": 13.77},
        {"name": "Bexalite (Raw)", "category": "Ore", "unit": "cSCU", "is_mineable": True, "is_trade_good": False, "base_value": 21.18},
        {"name": "Taranite (Raw)", "category": "Ore", "unit": "cSCU", "is_mineable": True, "is_trade_good": False, "base_value": 16.42},
        {"name": "Laranite (Raw)", "category": "Ore", "unit": "cSCU", "is_mineable": True, "is_trade_good": False, "base_value": 15.21},
        {"name": "Quantainium (Raw)", "category": "Ore", "unit": "cSCU", "is_mineable": True, "is_trade_good": False, "base_value": 44.00},
        
        # GASES
        {"name": "Hydrogen", "category": "Gas", "unit": "SCU", "is_mineable": False, "is_trade_good": True, "base_value": 0.80},
        {"name": "Astatine", "category": "Gas", "unit": "SCU", "is_mineable": False, "is_trade_good": True, "base_value": 5.00},
        
        # SALVAGE MATERIALS
        {"name": "Construction Materials", "category": "Salvage", "unit": "SCU", "is_salvage": True, "is_trade_good": True, "base_value": 1.50},
        {"name": "Recycled Material Composite", "category": "Salvage", "unit": "SCU", "is_salvage": True, "is_trade_good": True, "base_value": 0.90},
    ]
    
    count = 0
    for mat_data in materials_data:
        existing = db.query(Material).filter(Material.name == mat_data["name"]).first()
        if not existing:
            material = Material(**mat_data)
            db.add(material)
            count += 1
    
    db.commit()
    print(f"✅ Added {count} materials")


def seed_locations(db: Session):
    """Seed locations (stations, refineries, etc.)."""
    print("\n📍 Seeding locations...")
    
    locations_data = [
        # STANTON SYSTEM
        {"code": "CRU-L1", "name": "CRU-L1", "system": "Stanton", "planet": "Crusader", "location": "Lagrange Point 1", "location_type": "Station"},
        {"code": "HUR-L1", "name": "HUR-L1", "system": "Stanton", "planet": "Hurston", "location": "Lagrange Point 1", "location_type": "Station"},
        {"code": "ARC-L1", "name": "ARC-L1", "system": "Stanton", "planet": "ArcCorp", "location": "Lagrange Point 1", "location_type": "Station"},
        {"code": "MIC-L1", "name": "MIC-L1", "system": "Stanton", "planet": "microTech", "location": "Lagrange Point 1", "location_type": "Station"},
        
        # REFINERIES
        {"code": "CRU-L1-REF", "name": "Gallete Family Farms", "system": "Stanton", "planet": "Crusader", "location": "CRU-L1", "location_type": "Refinery"},
        {"code": "HUR-L1-REF", "name": "Tram & Myers Mining", "system": "Stanton", "planet": "Hurston", "location": "HUR-L1", "location_type": "Refinery"},
        {"code": "ARC-L1-REF", "name": "ArcCorp Mining Area 045", "system": "Stanton", "planet": "ArcCorp", "location": "ARC-L1", "location_type": "Refinery"},
        {"code": "MIC-L1-REF", "name": "Shubin Interstellar SAL-5", "system": "Stanton", "planet": "microTech", "location": "MIC-L1", "location_type": "Refinery"},
        
        # TRADING POSTS
        {"code": "HDMS-BEZDEK", "name": "HDMS Bezdek", "system": "Stanton", "planet": "Hurston", "location": "Hurston", "location_type": "Outpost"},
        {"code": "HDMS-OPAREI", "name": "HDMS Oparei", "system": "Stanton", "planet": "Hurston", "location": "Hurston", "location_type": "Outpost"},
        {"code": "PORT-OLISAR", "name": "Port Olisar", "system": "Stanton", "planet": "Crusader", "location": "Crusader", "location_type": "Station"},
    ]
    
    count = 0
    for loc_data in locations_data:
        # Build full_path
        full_path = f"{loc_data['system']} > {loc_data['planet']}"
        if loc_data['location']:
            full_path += f" > {loc_data['location']}"
        full_path += f" > {loc_data['name']}"
        
        loc_data['full_path'] = full_path
        
        existing = db.query(Location).filter(Location.code == loc_data["code"]).first()
        if not existing:
            location = Location(**loc_data)
            db.add(location)
            count += 1
    
    db.commit()
    print(f"✅ Added {count} locations")


def seed_refineries(db: Session):
    """Seed refineries with processing modifiers."""
    print("\n🏭 Seeding refineries...")
    
    # Get refinery locations
    refinery_locations = db.query(Location).filter(Location.location_type == "Refinery").all()
    
    count = 0
    for loc in refinery_locations:
        existing = db.query(Refinery).filter(Refinery.location_id == loc.id).first()
        if not existing:
            refinery = Refinery(
                name=loc.name,
                system=loc.system,
                location_id=loc.id,
                processing_time_modifier=Decimal("1.0"),
                cost_modifier=Decimal("1.0")
            )
            db.add(refinery)
            count += 1
    
    db.commit()
    print(f"✅ Added {count} refineries")


def seed_market_prices(db: Session):
    """Seed initial market prices (placeholder values)."""
    print("\n💰 Seeding market prices...")
    
    materials = db.query(Material).filter(Material.is_trade_good == True).all()
    
    count = 0
    for mat in materials:
        existing = db.query(MarketPrice).filter(MarketPrice.material_id == mat.id).first()
        if not existing:
            # Use base_value as initial price
            base = mat.base_value or Decimal("1.0")
            
            market_price = MarketPrice(
                material_id=mat.id,
                avg_buy_price=base * Decimal("0.85"),
                avg_sell_price=base * Decimal("1.15"),
                min_buy_price=base * Decimal("0.70"),
                max_sell_price=base * Decimal("1.30")
            )
            db.add(market_price)
            count += 1
    
    db.commit()
    print(f"✅ Added {count} market prices")


def main():
    """Run all seed functions."""
    print("=" * 70)
    print("🌱 STAR CITIZEN DATABASE SEEDING")
    print("=" * 70)
    
    db = SessionLocal()
    
    try:
        seed_materials(db)
        seed_locations(db)
        seed_refineries(db)
        seed_market_prices(db)
        
        print("\n" + "=" * 70)
        print("✅ DATABASE SEEDING COMPLETE!")
        print("=" * 70)
        
        # Print summary
        mat_count = db.query(Material).count()
        loc_count = db.query(Location).count()
        ref_count = db.query(Refinery).count()
        price_count = db.query(MarketPrice).count()
        
        print(f"\n📊 SUMMARY:")
        print(f"   Materials: {mat_count}")
        print(f"   Locations: {loc_count}")
        print(f"   Refineries: {ref_count}")
        print(f"   Market Prices: {price_count}")
        print()
        
    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
