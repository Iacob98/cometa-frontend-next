#!/usr/bin/env python3
"""
Script to add missing table models to models.py
"""

def add_missing_models():
    """Add missing model classes to models.py"""

    missing_models = """
# Additional models for existing database tables

class ActivityLogs(Base):
    __tablename__ = 'activity_logs'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=False)
    action = Column(Text, nullable=False)
    timestamp = Column(DateTime, nullable=False, default=datetime.utcnow)
    details = Column(JSONB)

    # Relationships
    user = relationship("User")

class InAppNotification(Base):
    __tablename__ = 'in_app_notifications'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    title = Column(Text, nullable=False)
    message = Column(Text, nullable=False)
    notification_type = Column(Text, default='info')
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    read_at = Column(DateTime)

    # Relationships
    user = relationship("User")

    __table_args__ = (
        CheckConstraint("notification_type IN ('info','warning','error','success')", name='check_notification_type'),
    )

class CompanyWarehouseMaterial(Base):
    __tablename__ = 'company_warehouse_materials'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    material_id = Column(UUID(as_uuid=True), ForeignKey('materials.id'), nullable=False)
    quantity = Column(Numeric(14, 3), nullable=False, default=0)
    reserved_quantity = Column(Numeric(14, 3), nullable=False, default=0)
    min_stock_level = Column(Numeric(14, 3), default=0)
    last_updated = Column(DateTime, default=datetime.utcnow)

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
    file_path = Column(Text, nullable=False)
    file_name = Column(Text, nullable=False)
    version = Column(Text, default='1.0')
    uploaded_by = Column(UUID(as_uuid=True), ForeignKey('users.id'))
    uploaded_at = Column(DateTime, default=datetime.utcnow)
    is_active = Column(Boolean, default=True)

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
    role = Column(Text)  # primary, secondary, backup
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
    contact_type = Column(Text, nullable=False)  # main, technical, billing, emergency
    name = Column(Text, nullable=False)
    position = Column(Text)
    phone = Column(Text)
    email = Column(Text)
    is_primary = Column(Boolean, default=False)

    # Relationships
    supplier = relationship("Supplier")

    __table_args__ = (
        CheckConstraint("contact_type IN ('main','technical','billing','emergency')", name='check_supplier_contact_type'),
    )
"""

    # Read current models.py file
    with open('/Users/iacob/Documents/cometa-2-dev/shared/models.py', 'r') as f:
        content = f.read()

    # Append new models to the end of the file
    content += missing_models

    # Write updated content back to file
    with open('/Users/iacob/Documents/cometa-2-dev/shared/models.py', 'w') as f:
        f.write(content)

    print("✅ Successfully added missing model classes to models.py")
    print("📋 Added models:")
    print("  - ActivityLogs")
    print("  - InAppNotification")
    print("  - CompanyWarehouseMaterial")
    print("  - ProjectDocument")
    print("  - ProjectPlan")
    print("  - ProjectSupplier")
    print("  - SupplierContact")

if __name__ == "__main__":
    add_missing_models()