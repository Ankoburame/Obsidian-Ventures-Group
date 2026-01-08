import sys
sys.path.insert(0, 'backend')

from database import SessionLocal
from models.user import User
from core.security import get_password_hash

db = SessionLocal()

new_admin = User(
    username='admin',
    email='admin@ovg.local',
    password_hash=get_password_hash('Admin123!'),
    is_admin=True,
    is_active=True
)

db.add(new_admin)
db.commit()

print('=' * 60)
print('ADMIN CREE!')
print('=' * 60)
print('Username: admin')
print('Password: Admin123!')
print('=' * 60)

admin_check = db.query(User).filter(User.username == 'admin').first()
if admin_check:
    print(f'Hash: {admin_check.password_hash[:50]}...')

db.close()