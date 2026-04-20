
from app import create_app, db
from app.models import User
import sys

app = create_app()
with app.app_context():
    users = User.query.all()
    if not users:
        print("No users found in database.")
    else:
        print(f"Found {len(users)} users:")
        for u in users:
            print(f"- {u.username} (Role: {u.role})")
