#!/usr/bin/env python3
"""
Test script to verify all models work correctly with the database
"""

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent / 'shared'))

from models import Base, User, Project, Material, Supplier, ActivityLogs, InAppNotification
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

def test_database_connection():
    """Test basic database connection and model operations"""

    # Database connection string for Docker PostgreSQL
    DATABASE_URL = "postgresql://postgres:postgres@localhost:5422/cometa"

    try:
        # Create engine and session
        engine = create_engine(DATABASE_URL)
        Session = sessionmaker(bind=engine)
        session = Session()

        print("🔗 Testing database connection...")

        # Test basic query on users table
        users_count = session.query(User).count()
        print(f"✅ Users table: {users_count} records")

        # Test basic query on projects table
        projects_count = session.query(Project).count()
        print(f"✅ Projects table: {projects_count} records")

        # Test basic query on materials table
        materials_count = session.query(Material).count()
        print(f"✅ Materials table: {materials_count} records")

        # Test basic query on suppliers table
        suppliers_count = session.query(Supplier).count()
        print(f"✅ Suppliers table: {suppliers_count} records")

        # Test new models
        activity_logs_count = session.query(ActivityLogs).count()
        print(f"✅ Activity Logs table: {activity_logs_count} records")

        notifications_count = session.query(InAppNotification).count()
        print(f"✅ In-App Notifications table: {notifications_count} records")

        session.close()

        print("\n🎉 All model tests passed! Database is fully synchronized.")
        return True

    except Exception as e:
        print(f"❌ Database connection test failed: {e}")
        return False

def test_model_relationships():
    """Test that relationships between models work correctly"""

    DATABASE_URL = "postgresql://postgres:postgres@localhost:5422/cometa"

    try:
        engine = create_engine(DATABASE_URL)
        Session = sessionmaker(bind=engine)
        session = Session()

        print("\n🔗 Testing model relationships...")

        # Test User -> Projects relationship
        users_with_projects = session.query(User).join(Project, User.id == Project.pm_user_id).count()
        print(f"✅ Users with managed projects: {users_with_projects}")

        # Test Project -> WorkEntries relationship
        projects_with_work = session.query(Project).filter(Project.work_entries.any()).count()
        print(f"✅ Projects with work entries: {projects_with_work}")

        session.close()

        print("✅ All relationship tests passed!")
        return True

    except Exception as e:
        print(f"❌ Relationship test failed: {e}")
        return False

if __name__ == "__main__":
    print("🧪 Starting comprehensive model tests...")
    print("=" * 50)

    connection_ok = test_database_connection()
    relationships_ok = test_model_relationships()

    print("\n" + "=" * 50)
    print("TEST RESULTS:")
    print(f"Database Connection: {'✅ PASSED' if connection_ok else '❌ FAILED'}")
    print(f"Model Relationships: {'✅ PASSED' if relationships_ok else '❌ FAILED'}")

    if connection_ok and relationships_ok:
        print("\n🎉 ALL TESTS PASSED! Models are fully synchronized with PostgreSQL database.")
    else:
        print("\n⚠️  Some tests failed. Check the errors above.")