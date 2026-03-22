import sqlite3
import os

for root, dirs, files in os.walk('.'):
    for f in files:
        if f.endswith('.db'):
            path = os.path.join(root, f)
            print(f"Modifying {path}")
            conn = sqlite3.connect(path)
            try:
                conn.execute("ALTER TABLE user ADD COLUMN role VARCHAR(20) DEFAULT 'user'")
                conn.commit()
                print("Added role column to user successfully.")
            except Exception as e:
                print("Notice (user): ", e)
            
            try:
                conn.execute("ALTER TABLE attendance ADD COLUMN course_code VARCHAR(50)")
                conn.commit()
                print("Added course_code column to attendance successfully.")
            except Exception as e:
                print("Notice (attendance): ", e)
            conn.close()
