
from app import create_app, db
from app.models import User
from werkzeug.security import generate_password_hash
import sys

app = create_app()
with app.app_context():
    # Ensure tables are created
    db.create_all()
    
    admin_user = User.query.filter_by(username='admin').first()
    if admin_user:
        print("Admin user already exists. Updating password to 'admin'...")
        admin_user.password_hash = generate_password_hash('admin', method='pbkdf2:sha256')
    else:
        print("Creating admin user with password 'admin'...")
        admin_user = User(
            username='admin',
            password_hash=generate_password_hash('admin', method='pbkdf2:sha256'),
            role='admin'
        )
        db.session.add(admin_user)
    
    db.session.commit()
    print("Success: Admin account is ready.")
