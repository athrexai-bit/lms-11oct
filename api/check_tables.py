import sqlite3
conn = sqlite3.connect('arthrex.db')
c = conn.cursor()
c.execute("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'discussion%'")
tables = c.fetchall()
print('Discussion tables:')
for t in tables:
    print(f'  ✅ {t[0]}')
conn.close()
