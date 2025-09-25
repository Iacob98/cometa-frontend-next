#!/usr/bin/env python3
"""
Script to analyze missing tables and columns in PostgreSQL database
by comparing with SQLAlchemy models
"""

import sys
import os
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent / 'shared'))

from models import Base
import psycopg2
from sqlalchemy import inspect
from sqlalchemy.dialects import postgresql

def get_db_connection():
    """Get database connection using Docker environment"""
    try:
        conn = psycopg2.connect(
            host="localhost",
            port=5422,  # Docker exposed port
            database="cometa",
            user="postgres",
            password="postgres"
        )
        return conn
    except Exception as e:
        print(f"Error connecting to database: {e}")
        return None

def get_existing_tables(conn):
    """Get list of existing tables from database"""
    cur = conn.cursor()
    cur.execute("""
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema='public'
        ORDER BY table_name
    """)
    tables = [row[0] for row in cur.fetchall()]
    cur.close()
    return set(tables)

def get_table_columns(conn, table_name):
    """Get columns for a specific table"""
    cur = conn.cursor()
    cur.execute("""
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_schema='public' AND table_name=%s
        ORDER BY ordinal_position
    """, (table_name,))
    columns = {}
    for row in cur.fetchall():
        columns[row[0]] = {
            'type': row[1],
            'nullable': row[2] == 'YES',
            'default': row[3]
        }
    cur.close()
    return columns

def get_model_tables():
    """Get all table names from SQLAlchemy models"""
    model_tables = {}
    for table_name, table in Base.metadata.tables.items():
        model_tables[table_name] = table
    return model_tables

def analyze_missing_elements():
    """Main analysis function"""
    conn = get_db_connection()
    if not conn:
        return

    try:
        # Get existing tables from database
        existing_tables = get_existing_tables(conn)
        print(f"Found {len(existing_tables)} existing tables in database")

        # Get model tables
        model_tables = get_model_tables()
        print(f"Found {len(model_tables)} tables in models")

        # Find missing tables
        missing_tables = set(model_tables.keys()) - existing_tables
        extra_tables = existing_tables - set(model_tables.keys())

        print("\n" + "="*50)
        print("MISSING TABLES ANALYSIS")
        print("="*50)

        if missing_tables:
            print(f"\n❌ MISSING TABLES ({len(missing_tables)}):")
            for table in sorted(missing_tables):
                print(f"  - {table}")
        else:
            print("\n✅ All model tables exist in database")

        if extra_tables:
            print(f"\n⚠️  EXTRA TABLES IN DB ({len(extra_tables)}):")
            for table in sorted(extra_tables):
                print(f"  - {table}")

        print("\n" + "="*50)
        print("MISSING COLUMNS ANALYSIS")
        print("="*50)

        # Analyze columns for existing tables
        missing_columns_found = False
        for table_name in sorted(set(model_tables.keys()) & existing_tables):
            model_table = model_tables[table_name]
            db_columns = get_table_columns(conn, table_name)

            model_columns = set(col.name for col in model_table.columns)
            db_column_names = set(db_columns.keys())

            missing_cols = model_columns - db_column_names
            extra_cols = db_column_names - model_columns

            if missing_cols or extra_cols:
                missing_columns_found = True
                print(f"\n📋 TABLE: {table_name}")

                if missing_cols:
                    print(f"  ❌ Missing columns ({len(missing_cols)}):")
                    for col_name in sorted(missing_cols):
                        col = model_table.columns[col_name]
                        col_type = col.type.compile(dialect=postgresql.dialect())
                        nullable = "NULL" if col.nullable else "NOT NULL"
                        default = f" DEFAULT {col.default}" if col.default else ""
                        print(f"    - {col_name}: {col_type} {nullable}{default}")

                if extra_cols:
                    print(f"  ⚠️  Extra columns ({len(extra_cols)}):")
                    for col_name in sorted(extra_cols):
                        col_info = db_columns[col_name]
                        print(f"    - {col_name}: {col_info['type']}")

        if not missing_columns_found:
            print("\n✅ All columns match between models and database")

        print(f"\n" + "="*50)
        print("SUMMARY")
        print("="*50)
        print(f"Missing tables: {len(missing_tables)}")
        print(f"Extra tables: {len(extra_tables)}")
        print(f"Tables with column differences: {len([t for t in set(model_tables.keys()) & existing_tables if (set(col.name for col in model_tables[t].columns) != set(get_table_columns(conn, t).keys()))])}")

    finally:
        conn.close()

if __name__ == "__main__":
    analyze_missing_elements()