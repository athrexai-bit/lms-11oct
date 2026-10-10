import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), 'arthrex.db')

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

conn = get_db()
c = conn.cursor()

# Check if certificates table exists
c.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='certificates'")
if c.fetchone():
    print('✅ Certificates table exists')
    c.execute('SELECT COUNT(*) FROM certificates')
    print(f'   Records: {c.fetchone()[0]}')
else:
    print('❌ Certificates table does NOT exist')
    print('Creating it now...')
    c.execute('''CREATE TABLE certificates (
        id           TEXT PRIMARY KEY,
        user_email   TEXT NOT NULL,
        user_name    TEXT NOT NULL,
        course_id    TEXT NOT NULL,
        course_name  TEXT NOT NULL,
        instructor   TEXT,
        issued_at    TEXT NOT NULL,
        certificate_id TEXT UNIQUE
    )''')
    conn.commit()
    print('✅ Created certificates table')

conn.close()
