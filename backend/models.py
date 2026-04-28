import sqlite3
import os
import psycopg2
from psycopg2.extras import RealDictCursor
from config import Config


class DBWrapper:
    """A wrapper to make PostgreSQL act a bit more like sqlite3 for our routes."""
    def __init__(self, conn, is_pg=False):
        self.conn = conn
        self.is_pg = is_pg

    def execute(self, sql, params=()):
        is_insert = sql.strip().upper().startswith('INSERT')
        
        if self.is_pg:
            sql = sql.replace('?', '%s')
            if is_insert and 'RETURNING' not in sql.upper():
                sql += ' RETURNING id'
        
        cursor = self.conn.cursor()
        cursor.execute(sql, params)
        
        if self.is_pg and is_insert:
            try:
                row = cursor.fetchone()
                if row:
                    # Patch cursor object to mock lastrowid
                    cursor.lastrowid = row.get('id') if isinstance(row, dict) else row[0]
            except Exception:
                pass
                
        return cursor

    def commit(self):
        self.conn.commit()

    def close(self):
        self.conn.close()


def get_db():
    """Get a database connection (Supabase/Postgres or Local/SQLite)."""
    db_url = getattr(Config, 'DATABASE_URL', None)
    
    if db_url and db_url.startswith('postgres'):
        conn = psycopg2.connect(db_url, cursor_factory=RealDictCursor)
        return DBWrapper(conn, is_pg=True)
    else:
        conn = sqlite3.connect(Config.DATABASE_PATH)
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA foreign_keys = ON")
        return DBWrapper(conn, is_pg=False)


def init_db():
    """Initialize the database with all required tables."""
    db = get_db()
    
    # Tables SQL (Postgres uses SERIAL, SQLite uses AUTOINCREMENT)
    id_type = "SERIAL" if db.is_pg else "INTEGER PRIMARY KEY AUTOINCREMENT"
    pk = "PRIMARY KEY" if db.is_pg else ""

    tables = [
        f"CREATE TABLE IF NOT EXISTS users (id {id_type} {pk}, name TEXT NOT NULL, email TEXT UNIQUE NOT NULL, password TEXT NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)",
        f"CREATE TABLE IF NOT EXISTS timetable (id {id_type} {pk}, user_id INTEGER NOT NULL, day TEXT NOT NULL, subject TEXT NOT NULL, start_time TEXT NOT NULL, end_time TEXT NOT NULL, room TEXT DEFAULT '', teacher TEXT DEFAULT '', created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)",
        f"CREATE TABLE IF NOT EXISTS homework (id {id_type} {pk}, user_id INTEGER NOT NULL, subject TEXT NOT NULL, description TEXT NOT NULL, status TEXT DEFAULT 'pending', due_date TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)",
        f"CREATE TABLE IF NOT EXISTS assignments (id {id_type} {pk}, user_id INTEGER NOT NULL, title TEXT NOT NULL, subject TEXT NOT NULL, description TEXT DEFAULT '', due_date TEXT NOT NULL, priority TEXT DEFAULT 'medium', status TEXT DEFAULT 'pending', created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)",
        f"CREATE TABLE IF NOT EXISTS certificates (id {id_type} {pk}, user_id INTEGER NOT NULL, title TEXT NOT NULL, category TEXT DEFAULT 'general', file_url TEXT NOT NULL, file_name TEXT NOT NULL, issued_date TEXT, description TEXT DEFAULT '', created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)",
        f"CREATE TABLE IF NOT EXISTS syllabus (id {id_type} {pk}, user_id INTEGER NOT NULL, subject TEXT NOT NULL, topic TEXT NOT NULL, status INTEGER DEFAULT 0, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)",
        f"CREATE TABLE IF NOT EXISTS reminders (id {id_type} {pk}, user_id INTEGER NOT NULL, type TEXT NOT NULL, message TEXT NOT NULL, trigger_time TEXT NOT NULL, is_sent INTEGER DEFAULT 0, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)",
        f"CREATE TABLE IF NOT EXISTS notes (id {id_type} {pk}, user_id INTEGER NOT NULL, video_id TEXT NOT NULL, topic TEXT, content TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)",
        f"CREATE TABLE IF NOT EXISTS email_logs (id {id_type} {pk}, subject TEXT NOT NULL, recipients_count INTEGER NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)",
        f"CREATE TABLE IF NOT EXISTS reviews (id {id_type} {pk}, user_id INTEGER NOT NULL, rating INTEGER NOT NULL, comment TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)"
    ]

    for table_sql in tables:
        try:
            db.execute(table_sql)
        except Exception as e:
            print(f"[DB INIT] Warning on table: {e}")

    db.commit()

    # Auto-migration for user profile fields
    user_fields = [
        ("first_name", "TEXT"),
        ("last_name", "TEXT"),
        ("mobile_no", "TEXT"),
        ("linkedin", "TEXT"),
        ("github", "TEXT"),
        ("profile_pic", "TEXT"),
        ("bio", "TEXT"),
        ("last_active", "TIMESTAMP DEFAULT CURRENT_TIMESTAMP")
    ]
    
    for field, ftype in user_fields:
        try:
            # Simplest way: try to add and catch "already exists" error
            db.execute(f"ALTER TABLE users ADD COLUMN {field} {ftype}")
            print(f"[DB MIGRATE] Added column: {field}")
        except Exception:
            # Column likely exists, skip
            pass

    db.commit()
    db.close()
    print("[OK] Database initialized successfully")
