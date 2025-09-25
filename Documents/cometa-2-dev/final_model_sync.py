#!/usr/bin/env python3
"""
Final synchronization script to match models with actual database structure
"""

import psycopg2

def get_actual_table_structure():
    """Get actual structure of tables from database"""
    conn = psycopg2.connect(
        host="localhost",
        port=5422,
        database="cometa",
        user="postgres",
        password="postgres"
    )

    cur = conn.cursor()

    # Get actual structure of problematic tables
    tables_to_fix = {
        'activity_logs': {},
        'company_warehouse_materials': {},
        'in_app_notifications': {},
        'project_documents': {},
        'project_plans': {},
        'project_suppliers': {},
        'supplier_contacts': {}
    }

    for table_name in tables_to_fix.keys():
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
        tables_to_fix[table_name] = columns
        print(f"\n📋 {table_name.upper()} columns:")
        for col_name, col_info in columns.items():
            nullable = "NULL" if col_info['nullable'] else "NOT NULL"
            default = f" DEFAULT {col_info['default']}" if col_info['default'] else ""
            print(f"  {col_name}: {col_info['type']} {nullable}{default}")

    cur.close()
    conn.close()

    return tables_to_fix

def update_model_definitions():
    """Update model definitions to match database structure"""

    # Read current models file
    with open('/Users/iacob/Documents/cometa-2-dev/shared/models.py', 'r') as f:
        content = f.read()

    # Define corrected models
    corrected_models = """
# Additional models for existing database tables - CORRECTED VERSIONS

class ActivityLogs(Base):
    __tablename__ = 'activity_logs'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=False)
    project_id = Column(UUID(as_uuid=True), ForeignKey('projects.id'), nullable=True)
    activity_type = Column(Text, nullable=False)
    entity_type = Column(Text)
    entity_id = Column(UUID(as_uuid=True))
    description = Column(Text)
    extra_data = Column(JSONB)
    ip_address = Column(Text)  # inet type mapped to Text
    user_agent = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User")
    project = relationship("Project")

class InAppNotification(Base):
    __tablename__ = 'in_app_notifications'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    title = Column(Text, nullable=False)
    message = Column(Text, nullable=False)
    notification_type = Column(Text, default='info')
    priority = Column(Text)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    read_at = Column(DateTime)
    expires_at = Column(DateTime)
    metadata_json = Column(JSONB)

    # Relationships
    user = relationship("User")

    __table_args__ = (
        CheckConstraint("notification_type IN ('info','warning','error','success')", name='check_notification_type'),
    )

class CompanyWarehouseMaterial(Base):
    __tablename__ = 'company_warehouse_materials'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    warehouse_id = Column(UUID(as_uuid=True))  # Should reference warehouse table
    material_id = Column(UUID(as_uuid=True), ForeignKey('materials.id'), nullable=False)
    quantity = Column(Numeric(14, 3), nullable=False, default=0)
    min_stock_level = Column(Numeric(14, 3), default=0)
    max_stock_level = Column(Numeric(14, 3))
    unit_cost = Column(Numeric(12, 2))
    last_updated = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    material = relationship("Material")

class ProjectDocument(Base):
    __tablename__ = 'project_documents'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey('projects.id', ondelete='CASCADE'), nullable=False)
    document_type = Column(Text, nullable=False)
    file_path = Column(Text, nullable=False)
    file_name = Column(Text, nullable=False)
    file_size = Column(Integer)
    mime_type = Column(Text)
    status = Column(Text)
    tags = Column(Text)  # Array mapped to Text
    notes = Column(Text)
    uploaded_by = Column(UUID(as_uuid=True), ForeignKey('users.id'))
    uploaded_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    project = relationship("Project")
    uploader = relationship("User")

class ProjectPlan(Base):
    __tablename__ = 'project_plans'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey('projects.id', ondelete='CASCADE'), nullable=False)
    plan_type = Column(Text, nullable=False)
    title = Column(Text)
    description = Column(Text)
    file_path = Column(Text, nullable=False)
    filename = Column(Text)
    file_size = Column(Integer)
    uploaded_by = Column(UUID(as_uuid=True), ForeignKey('users.id'))
    uploaded_at = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    project = relationship("Project")
    uploader = relationship("User")

    __table_args__ = (
        CheckConstraint("plan_type IN ('site_plan','technical_plan','layout_plan','other')", name='check_plan_type'),
    )

class ProjectSupplier(Base):
    __tablename__ = 'project_suppliers'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey('projects.id', ondelete='CASCADE'), nullable=False)
    supplier_id = Column(UUID(as_uuid=True), ForeignKey('suppliers.id'), nullable=False)
    status = Column(Text)
    assigned_by = Column(UUID(as_uuid=True), ForeignKey('users.id'))
    assigned_at = Column(DateTime, default=datetime.utcnow)
    is_active = Column(Boolean, default=True)
    notes = Column(Text)

    # Relationships
    project = relationship("Project")
    supplier = relationship("Supplier")
    assignee = relationship("User")

class SupplierContact(Base):
    __tablename__ = 'supplier_contacts'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    supplier_id = Column(UUID(as_uuid=True), ForeignKey('suppliers.id', ondelete='CASCADE'), nullable=False)
    contact_name = Column(Text)
    department = Column(Text)
    position = Column(Text)
    phone = Column(Text)
    email = Column(Text)
    is_primary = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    notes = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    supplier = relationship("Supplier")
"""

    # Replace the old model definitions with corrected ones
    # Find the start of additional models section
    start_marker = "# Additional models for existing database tables"
    start_pos = content.find(start_marker)

    if start_pos != -1:
        # Replace everything from the marker to the end
        content = content[:start_pos] + corrected_models
    else:
        # Append to the end if marker not found
        content += corrected_models

    # Write updated content
    with open('/Users/iacob/Documents/cometa-2-dev/shared/models.py', 'w') as f:
        f.write(content)

    print("\n✅ Updated model definitions to match database structure")

if __name__ == "__main__":
    print("🔍 Analyzing actual database structure...")
    get_actual_table_structure()

    print("\n📝 Updating model definitions...")
    update_model_definitions()