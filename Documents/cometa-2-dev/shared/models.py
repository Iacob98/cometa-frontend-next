from sqlalchemy import Column, String, Integer, Boolean, Date, DateTime, Numeric, Text, ForeignKey, CheckConstraint
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID, JSONB
import uuid
from datetime import datetime, date

Base = declarative_base()

class User(Base):
    __tablename__ = 'users'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    first_name = Column(Text, nullable=False)
    last_name = Column(Text, nullable=False)
    phone = Column(Text, unique=True)
    email = Column(Text, unique=True)
    lang_pref = Column(Text, default='ru')
    role = Column(Text, nullable=False)
    is_active = Column(Boolean, nullable=False, default=True)
    skills = Column(JSONB)  # Store skills as JSON array
    pin_code = Column(Text)  # 4-6 digit PIN for crew/foreman easy login
    
    __table_args__ = (
        CheckConstraint("role IN ('admin','pm','foreman','crew','viewer','worker')", name='check_user_role'),
    )

class Project(Base):
    __tablename__ = 'projects'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(Text, nullable=False)
    customer = Column(Text)
    city = Column(Text)
    address = Column(Text)
    contact_24h = Column(Text)
    start_date = Column(Date)
    end_date_plan = Column(Date)
    status = Column(Text, nullable=False, default='draft')
    total_length_m = Column(Numeric(10, 2), nullable=False, default=0)
    base_rate_per_m = Column(Numeric(12, 2), nullable=False, default=0)
    pm_user_id = Column(UUID(as_uuid=True), ForeignKey('users.id'))
    language_default = Column(Text, default='de')
    approved = Column(Boolean, default=False)
    
    # Relationships
    pm_user = relationship("User")
    cabinets = relationship("Cabinet", back_populates="project")
    work_entries = relationship("WorkEntry", back_populates="project")
    costs = relationship("Cost", back_populates="project")
    houses = relationship("House", back_populates="project")
    
    __table_args__ = (
        CheckConstraint("status IN ('draft','active','waiting_invoice','closed')", name='check_project_status'),
    )

class Cabinet(Base):
    __tablename__ = 'cabinets'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey('projects.id', ondelete='CASCADE'), nullable=False)
    code = Column(Text)
    name = Column(Text)
    address = Column(Text)
    geom_point = Column(JSONB)
    
    # Relationships
    project = relationship("Project", back_populates="cabinets")
    segments = relationship("Segment", back_populates="cabinet")

class Segment(Base):
    __tablename__ = 'segments'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    cabinet_id = Column(UUID(as_uuid=True), ForeignKey('cabinets.id', ondelete='CASCADE'), nullable=False)
    name = Column(Text)
    length_planned_m = Column(Numeric(10, 2), nullable=False, default=0)
    surface = Column(Text, nullable=False)
    area = Column(Text, nullable=False)
    depth_req_m = Column(Numeric(6, 3))
    width_req_m = Column(Numeric(6, 3))
    geom_line = Column(JSONB)
    status = Column(Text, nullable=False, default='open')
    
    # Relationships
    cabinet = relationship("Cabinet", back_populates="segments")
    cuts = relationship("Cut", back_populates="segment")
    
    __table_args__ = (
        CheckConstraint("surface IN ('asphalt','concrete','pavers','green')", name='check_segment_surface'),
        CheckConstraint("area IN ('roadway','sidewalk','driveway','green')", name='check_segment_area'),
        CheckConstraint("status IN ('open','in_progress','done')", name='check_segment_status'),
    )

class Cut(Base):
    __tablename__ = 'cuts'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    segment_id = Column(UUID(as_uuid=True), ForeignKey('segments.id', ondelete='CASCADE'), nullable=False)
    code = Column(Text)
    length_planned_m = Column(Numeric(10, 2), nullable=False, default=0)
    length_done_m = Column(Numeric(10, 2), nullable=False, default=0)
    status = Column(Text, nullable=False, default='open')
    
    # Relationships
    segment = relationship("Segment", back_populates="cuts")
    work_entries = relationship("WorkEntry", back_populates="cut")
    
    __table_args__ = (
        CheckConstraint("status IN ('open','in_progress','done')", name='check_cut_status'),
    )

class StageDef(Base):
    __tablename__ = 'stage_defs'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    code = Column(Text, unique=True, nullable=False)
    name_ru = Column(Text, nullable=False)
    name_de = Column(Text)
    requires_photos_min = Column(Integer, default=1)
    requires_measurements = Column(Boolean, default=False)
    requires_density = Column(Boolean, default=False)
    
    __table_args__ = (
        CheckConstraint("code IN ('stage_1_marking','stage_2_excavation','stage_3_conduit','stage_4_cable','stage_5_splice','stage_6_test','stage_7_connect','stage_8_final','stage_9_backfill','stage_10_surface')", name='check_stage_code'),
    )

class WorkEntry(Base):
    __tablename__ = 'work_entries'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey('projects.id', ondelete='CASCADE'), nullable=False)
    cabinet_id = Column(UUID(as_uuid=True), ForeignKey('cabinets.id'))
    segment_id = Column(UUID(as_uuid=True), ForeignKey('segments.id'))
    cut_id = Column(UUID(as_uuid=True), ForeignKey('cuts.id'))
    house_id = Column(UUID(as_uuid=True), ForeignKey('houses.id'))
    crew_id = Column(UUID(as_uuid=True), ForeignKey('crews.id'))
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id'))
    date = Column(Date, nullable=False, default=datetime.now().date())
    stage_code = Column(Text, nullable=False)
    meters_done_m = Column(Numeric(10, 2), nullable=False)
    method = Column(Text)
    width_m = Column(Numeric(6, 3))
    depth_m = Column(Numeric(6, 3))
    cables_count = Column(Integer)
    has_protection_pipe = Column(Boolean)
    soil_type = Column(Text)
    notes = Column(Text)
    approved_by = Column(UUID(as_uuid=True), ForeignKey('users.id'))
    approved_at = Column(DateTime)
    approved = Column(Boolean, default=False)
    
    # Relationships
    project = relationship("Project", back_populates="work_entries")
    cut = relationship("Cut", back_populates="work_entries")
    house = relationship("House")
    user = relationship("User", foreign_keys=[user_id])
    approver = relationship("User", foreign_keys=[approved_by])
    photos = relationship("Photo", back_populates="work_entry")
    
    __table_args__ = (
        CheckConstraint("method IN ('mole','hand','excavator','trencher','documentation')", name='check_work_method'),
        CheckConstraint("meters_done_m >= 0", name='check_meters_positive'),
    )

class Photo(Base):
    __tablename__ = 'photos'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    work_entry_id = Column(UUID(as_uuid=True), ForeignKey('work_entries.id', ondelete='CASCADE'))
    cut_stage_id = Column(UUID(as_uuid=True))
    url = Column(Text, nullable=False)
    ts = Column(DateTime, nullable=False, default=datetime.now)
    gps_lat = Column(Numeric(10, 6))
    gps_lon = Column(Numeric(10, 6))
    author_user_id = Column(UUID(as_uuid=True), ForeignKey('users.id'))
    label = Column(Text)
    
    # Relationships
    work_entry = relationship("WorkEntry", back_populates="photos")
    author = relationship("User")
    
    __table_args__ = (
        CheckConstraint("label IN ('before','during','after','instrument','other')", name='check_photo_label'),
    )

class Crew(Base):
    __tablename__ = 'crews'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey('projects.id'))
    name = Column(Text, nullable=False)
    foreman_user_id = Column(UUID(as_uuid=True), ForeignKey('users.id'))
    status = Column(Text)
    
    # Relationships
    foreman = relationship("User")
    members = relationship("CrewMember", back_populates="crew")
    


class CrewMember(Base):
    __tablename__ = 'crew_members'
    
    crew_id = Column(UUID(as_uuid=True), ForeignKey('crews.id', ondelete='CASCADE'), primary_key=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id', ondelete='CASCADE'), primary_key=True)
    role_in_crew = Column(Text, nullable=False)
    active_from = Column(Date)
    active_to = Column(Date)
    
    # Relationships
    crew = relationship("Crew", back_populates="members")
    user = relationship("User")
    
    __table_args__ = (
        CheckConstraint("role_in_crew IN ('foreman','operator','worker')", name='check_crew_role'),
    )

class Material(Base):
    __tablename__ = 'materials'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(Text, nullable=False)
    unit = Column(Text, nullable=False)
    sku = Column(Text)
    description = Column(Text)
    default_price_eur = Column(Numeric(12, 2))
    purchase_price_eur = Column(Numeric(12, 2))
    current_stock_qty = Column(Numeric(14, 3), default=0)
    
    # Relationships
    inventory_items = relationship("Inventory", back_populates="material")
    
    __table_args__ = (
        CheckConstraint("unit IN ('m','m2','kg','t','pcs','roll','m3','l','other')", name='check_material_unit'),
    )

class StockLocation(Base):
    __tablename__ = 'stock_locations'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(Text, nullable=False)
    project_id = Column(UUID(as_uuid=True), ForeignKey('projects.id'))
    address = Column(Text)
    
    # Relationships
    inventory_items = relationship("Inventory", back_populates="location")
    
    __table_args__ = (
        CheckConstraint("name IN ('main_warehouse','site_storage','rented_container','other')", name='check_location_name'),
    )

class Inventory(Base):
    __tablename__ = 'inventory'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    material_id = Column(UUID(as_uuid=True), ForeignKey('materials.id', ondelete='CASCADE'), nullable=False)
    location_id = Column(UUID(as_uuid=True), ForeignKey('stock_locations.id', ondelete='CASCADE'), nullable=False)
    qty = Column(Numeric(14, 3), nullable=False, default=0)
    
    # Relationships
    material = relationship("Material", back_populates="inventory_items")
    location = relationship("StockLocation", back_populates="inventory_items")

class Cost(Base):
    __tablename__ = 'costs'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey('projects.id', ondelete='CASCADE'), nullable=False)
    cost_type = Column(Text, nullable=False)
    ref_id = Column(UUID(as_uuid=True))
    date = Column(Date, nullable=False)
    amount_eur = Column(Numeric(12, 2), nullable=False)
    description = Column(Text)
    reference_id = Column(UUID(as_uuid=True))
    reference_type = Column(Text)
    
    # Relationships
    project = relationship("Project", back_populates="costs")
    
    __table_args__ = (
        CheckConstraint("cost_type IN ('facility','equipment_rental','material','transport','housing','other')", name='check_cost_type'),
    )

class Supplier(Base):
    __tablename__ = 'suppliers'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(Text, nullable=False)
    company_name = Column(Text)  # Alias for name field
    contact_info = Column(Text)
    contact_person = Column(Text)  # Specific contact person
    phone = Column(Text)  # Phone number
    email = Column(Text)  # Email address
    address = Column(Text)
    notes = Column(Text)  # Additional notes about the supplier
    is_active = Column(Boolean, default=True)
    org_name = Column(Text)

    # Relationships

class MaterialOrder(Base):
    __tablename__ = 'material_orders'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey('projects.id'))
    supplier_material_id = Column(UUID(as_uuid=True), ForeignKey('supplier_materials.id'), nullable=False)
    quantity = Column(Numeric(14, 3), nullable=False)
    unit_price_eur = Column(Numeric(12, 2), nullable=False)
    delivery_cost_eur = Column(Numeric(12, 2), default=0)
    total_cost_eur = Column(Numeric(12, 2), nullable=False)
    status = Column(Text, nullable=False, default='ordered')
    order_date = Column(Date, nullable=False, default=datetime.now().date())
    expected_delivery_date = Column(Date)
    actual_delivery_date = Column(Date)
    notes = Column(Text)
    ordered_by = Column(UUID(as_uuid=True), ForeignKey('users.id'))
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    supplier_material = relationship("SupplierMaterial", back_populates="orders")
    project = relationship("Project")
    ordered_by_user = relationship("User")
    moves = relationship("MaterialMove", back_populates="order")

    __table_args__ = (
        CheckConstraint("status IN ('ordered','delivered','cancelled')", name='check_order_status'),
        CheckConstraint("quantity > 0", name='check_quantity_positive'),
        CheckConstraint("total_cost_eur >= 0", name='check_total_cost_positive'),
    )

class MaterialMove(Base):
    __tablename__ = 'material_moves'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    material_id = Column(UUID(as_uuid=True), ForeignKey('materials.id'), nullable=False)
    from_location_id = Column(UUID(as_uuid=True), ForeignKey('stock_locations.id'))
    to_location_id = Column(UUID(as_uuid=True), ForeignKey('stock_locations.id'))
    order_id = Column(UUID(as_uuid=True), ForeignKey('material_orders.id'))
    qty = Column(Numeric(14, 3), nullable=False)
    move_type = Column(Text, nullable=False)
    date = Column(Date, nullable=False, default=datetime.now().date())
    
    # Relationships
    material = relationship("Material")
    from_location = relationship("StockLocation", foreign_keys=[from_location_id])
    to_location = relationship("StockLocation", foreign_keys=[to_location_id])
    order = relationship("MaterialOrder", back_populates="moves")
    
    __table_args__ = (
        CheckConstraint("move_type IN ('in','out','transfer','loss','adjustment')", name='check_move_type'),
    )

class OffmassLine(Base):
    __tablename__ = 'offmass_lines'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey('projects.id'), nullable=False)
    description = Column(Text, nullable=False)
    quantity = Column(Numeric(12, 3), nullable=False)
    unit_price = Column(Numeric(12, 2), nullable=False)
    total_amount = Column(Numeric(12, 2), nullable=False)
    date = Column(Date, nullable=False, default=datetime.now().date())

# Original ActivityLog class removed - using new one at end of file

# Project preparation models

class Facility(Base):
    __tablename__ = 'facilities'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey('projects.id', ondelete='CASCADE'), nullable=False)
    type = Column(Text, nullable=False)  # toilet, container, generator, etc.
    supplier_id = Column(UUID(as_uuid=True), ForeignKey('suppliers.id'), nullable=True)
    rent_daily_eur = Column(Numeric(10, 2), nullable=False)
    service_freq = Column(Text)  # daily, weekly, etc.
    status = Column(Text, nullable=False, default='planned')
    start_date = Column(Date)
    end_date = Column(Date)
    location_text = Column(Text)
    geom_point = Column(JSONB)

class HseRequirement(Base):
    __tablename__ = 'hse_requirements'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey('projects.id', ondelete='CASCADE'), nullable=False)
    type = Column(Text, nullable=False)
    deadline = Column(Date)
    assignee_user_id = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=True)
    file_url = Column(Text)
    status = Column(Text, nullable=False, default='open')
    notes = Column(Text)

class HousingUnit(Base):
    __tablename__ = 'housing_units'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey('projects.id', ondelete='CASCADE'), nullable=False)
    address = Column(Text, nullable=False)
    rooms_total = Column(Integer, nullable=False)
    beds_total = Column(Integer, nullable=False)
    rent_daily_eur = Column(Numeric(10, 2), nullable=False)
    status = Column(Text, nullable=False, default='available')

class HousingAllocation(Base):
    __tablename__ = 'housing_allocations'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    housing_id = Column(UUID(as_uuid=True), ForeignKey('housing_units.id', ondelete='CASCADE'), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    bed_no = Column(Integer)
    from_date = Column(Date, nullable=False)
    to_date = Column(Date)

class Equipment(Base):
    __tablename__ = 'equipment'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    type = Column(Text, nullable=False)  # machine, tool, measuring_device  
    name = Column(Text, nullable=False)
    inventory_no = Column(Text)
    owned = Column(Boolean, nullable=False, default=True)
    status = Column(Text, nullable=False, default='available')
    purchase_price_eur = Column(Numeric(12, 2))
    rental_price_per_day_eur = Column(Numeric(10, 2))
    rental_price_per_hour_eur = Column(Numeric(10, 2))
    current_location = Column(Text)
    
    __table_args__ = (
        CheckConstraint("type IN ('machine','tool','measuring_device')", name='check_equipment_type'),
        CheckConstraint("status IN ('available','in_use','maintenance','broken')", name='check_equipment_status'),
    )

class Rental(Base):
    __tablename__ = 'rentals'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    type = Column(Text, nullable=False)  # vehicle, equipment, facility
    object_id = Column(UUID(as_uuid=True), nullable=False)  # ID of rented object
    supplier_id = Column(UUID(as_uuid=True), ForeignKey('suppliers.id'), nullable=False)
    daily_rate_eur = Column(Numeric(10, 2), nullable=False)
    start_date = Column(Date, nullable=False)
    end_date_plan = Column(Date, nullable=False)
    status = Column(Text, nullable=False, default='planned')
    
    # Relationships
    supplier = relationship("Supplier")
    
    __table_args__ = (
        CheckConstraint("type IN ('vehicle','equipment','facility')", name='check_rental_type'),
        CheckConstraint("status IN ('planned','active','finished','cancelled')", name='check_rental_status'),
    )

class EquipmentAssignment(Base):
    __tablename__ = 'equipment_assignments'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    equipment_id = Column(UUID(as_uuid=True), ForeignKey('equipment.id'), nullable=False)
    project_id = Column(UUID(as_uuid=True), ForeignKey('projects.id'), nullable=False)
    cabinet_id = Column(UUID(as_uuid=True), ForeignKey('cabinets.id'), nullable=True)
    crew_id = Column(UUID(as_uuid=True), ForeignKey('crews.id'), nullable=True)
    from_ts = Column(DateTime, nullable=False, default=datetime.utcnow)
    to_ts = Column(DateTime, nullable=True)
    is_permanent = Column(Boolean, default=False)
    rental_cost_per_day = Column(Numeric(10, 2))
    
    # Relationships
    equipment = relationship("Equipment")
    project = relationship("Project")
    cabinet = relationship("Cabinet")
    crew = relationship("Crew")

class EquipmentMaintenance(Base):
    __tablename__ = 'equipment_maintenance'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    equipment_id = Column(UUID(as_uuid=True), ForeignKey('equipment.id'), nullable=False)
    date = Column(Date, nullable=False)
    description = Column(Text, nullable=False)
    cost_eur = Column(Numeric(10, 2), nullable=False, default=0)
    performed_by = Column(Text)
    
    # Relationships
    equipment = relationship("Equipment")

class Vehicle(Base):
    __tablename__ = 'vehicles'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    plate_number = Column(Text, unique=True, nullable=False)
    type = Column(Text, nullable=False)  # van, truck, trailer, excavator
    brand = Column(Text)
    model = Column(Text)
    owned = Column(Boolean, nullable=False, default=True)
    status = Column(Text, nullable=False, default='available')
    purchase_price_eur = Column(Numeric(12, 2))
    rental_price_per_day_eur = Column(Numeric(10, 2))
    rental_price_per_hour_eur = Column(Numeric(10, 2))
    fuel_consumption_l_100km = Column(Numeric(5, 2))
    current_location = Column(Text)
    mileage = Column(Numeric(10, 2))
    vin = Column(Text)
    year_of_manufacture = Column(Integer)
    
    __table_args__ = (
        CheckConstraint("type IN ('van','truck','trailer','excavator','other')", name='check_vehicle_type'),
        CheckConstraint("status IN ('available','in_use','maintenance','broken')", name='check_vehicle_status'),
    )

class VehicleAssignment(Base):
    __tablename__ = 'vehicle_assignments'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    vehicle_id = Column(UUID(as_uuid=True), ForeignKey('vehicles.id'), nullable=False)
    project_id = Column(UUID(as_uuid=True), ForeignKey('projects.id'), nullable=False)
    crew_id = Column(UUID(as_uuid=True), ForeignKey('crews.id'), nullable=True)
    from_ts = Column(DateTime, nullable=False, default=datetime.utcnow)
    to_ts = Column(DateTime, nullable=True)
    is_permanent = Column(Boolean, default=False)
    rental_cost_per_day = Column(Numeric(10, 2))
    
    # Relationships
    vehicle = relationship("Vehicle")
    project = relationship("Project")
    crew = relationship("Crew")

class VehicleExpense(Base):
    __tablename__ = 'vehicle_expenses'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    vehicle_id = Column(UUID(as_uuid=True), ForeignKey('vehicles.id'), nullable=False)
    type = Column(Text, nullable=False)  # fuel, repair, toll, parking
    amount_eur = Column(Numeric(10, 2), nullable=False)
    date = Column(Date, nullable=False)
    note = Column(Text)
    
    # Relationships
    vehicle = relationship("Vehicle")
    
    __table_args__ = (
        CheckConstraint("type IN ('fuel','repair','toll','parking','other')", name='check_expense_type'),
    )

class VehicleTracking(Base):
    __tablename__ = 'vehicle_tracking'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    vehicle_id = Column(UUID(as_uuid=True), ForeignKey('vehicles.id'), nullable=False)
    timestamp = Column(DateTime, nullable=False, default=datetime.utcnow)
    lat = Column(Numeric(10, 7))
    lon = Column(Numeric(10, 7))
    
    # Relationships
    vehicle = relationship("Vehicle")

class RentalExpense(Base):
    __tablename__ = 'rental_expenses'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    rental_id = Column(UUID(as_uuid=True), ForeignKey('rentals.id'), nullable=False)
    date = Column(Date, nullable=False)
    days = Column(Integer, nullable=False, default=1)
    amount_eur = Column(Numeric(10, 2), nullable=False)
    
    # Relationships
    rental = relationship("Rental")
    end_date_plan = Column(Date)
    status = Column(Text, nullable=False, default='planned')

class AssetAssignment(Base):
    __tablename__ = 'asset_assignments'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    equipment_id = Column(UUID(as_uuid=True), ForeignKey('equipment.id', ondelete='CASCADE'), nullable=False)
    project_id = Column(UUID(as_uuid=True), ForeignKey('projects.id', ondelete='CASCADE'), nullable=False)
    cabinet_id = Column(UUID(as_uuid=True), ForeignKey('cabinets.id'), nullable=True)
    crew_id = Column(UUID(as_uuid=True), ForeignKey('crews.id'), nullable=True)
    from_ts = Column(DateTime, nullable=False)
    to_ts = Column(DateTime)

# Houses and connections
class House(Base):
    __tablename__ = 'houses'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey('projects.id', ondelete='CASCADE'), nullable=False)
    cabinet_id = Column(UUID(as_uuid=True), ForeignKey('cabinets.id'), nullable=True)
    address = Column(Text, nullable=False)
    house_number = Column(Text)
    connection_type = Column(Text, nullable=False)  # full, partial (was property, in_home)
    method = Column(Text, nullable=False)  # trench, mole
    status = Column(Text, default='not_assigned')  # not_assigned, appointment_scheduled, in_progress, connected, partial_only, postponed
    planned_length_m = Column(Numeric(10, 2))
    contact_name = Column(Text)
    contact_phone = Column(Text)
    contact_email = Column(Text)
    appointment_date = Column(Date)
    appointment_time = Column(Text)
    notes = Column(Text)
    geom_point = Column(JSONB)
    
    # Relationships
    project = relationship("Project", back_populates="houses")
    cabinet = relationship("Cabinet")

class HouseDocument(Base):
    __tablename__ = 'house_documents'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    house_id = Column(UUID(as_uuid=True), ForeignKey('houses.id', ondelete='CASCADE'), nullable=False)
    doc_type = Column(Text, nullable=False)  # plan, scheme, permit, photo_before, photo_after, other
    file_path = Column(Text, nullable=False)
    filename = Column(Text, nullable=False)
    upload_date = Column(DateTime, default=datetime.now)
    uploaded_by = Column(UUID(as_uuid=True), ForeignKey('users.id'))
    
    # Relationships
    house = relationship("House")
    uploader = relationship("User")

class HouseDoc(Base):
    __tablename__ = 'house_docs'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    house_id = Column(UUID(as_uuid=True), ForeignKey('houses.id', ondelete='CASCADE'), nullable=False)
    kind = Column(Text, nullable=False)  # permission, consent, etc.
    file_url = Column(Text, nullable=False)
    uploaded_at = Column(DateTime, nullable=False, default=datetime.utcnow)

class HouseContact(Base):
    __tablename__ = 'house_contacts'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    house_id = Column(UUID(as_uuid=True), ForeignKey('houses.id', ondelete='CASCADE'), nullable=False)
    name = Column(Text, nullable=False)
    phone = Column(Text)
    email = Column(Text)
    role = Column(Text)  # owner, tenant, manager

class HouseStatus(Base):
    __tablename__ = 'house_status'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    house_id = Column(UUID(as_uuid=True), ForeignKey('houses.id', ondelete='CASCADE'), nullable=False)
    status = Column(Text, nullable=False)
    reason = Column(Text)
    changed_by = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=True)
    changed_at = Column(DateTime, nullable=False, default=datetime.utcnow)

class Appointment(Base):
    __tablename__ = 'appointments'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    house_id = Column(UUID(as_uuid=True), ForeignKey('houses.id', ondelete='CASCADE'), nullable=False)
    crew_id = Column(UUID(as_uuid=True), ForeignKey('crews.id'), nullable=True)
    start_ts = Column(DateTime, nullable=False)
    end_ts = Column(DateTime, nullable=False)
    status = Column(Text, nullable=False, default='scheduled')
    notes = Column(Text)

class ActivityLog(Base):
    __tablename__ = 'activity_log'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=False)
    project_id = Column(UUID(as_uuid=True), ForeignKey('projects.id'), nullable=True)
    activity_type = Column(Text, nullable=False)  # work_entry_created, material_assigned, etc
    object_type = Column(Text, nullable=False)    # WorkEntry, Material, User, etc
    object_id = Column(UUID(as_uuid=True), nullable=True)
    action = Column(Text, nullable=False)         # created, updated, deleted, approved
    description = Column(Text)                    # Human readable description
    extra_data = Column(JSONB)                    # Additional structured data
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    
    # Relationships
    user = relationship("User")
    project = relationship("Project")

class MaterialStageMapping(Base):
    __tablename__ = 'material_stage_mapping'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    stage_name = Column(Text, nullable=False)     # stage_1_plan, stage_2_excavation, etc
    material_id = Column(UUID(as_uuid=True), ForeignKey('materials.id'), nullable=False)
    typical_quantity = Column(Numeric(10, 2))    # Typical amount needed
    is_required = Column(Boolean, default=True)  # Is this material mandatory for stage
    notes = Column(Text)                         # Additional notes
    
    # Relationships
    material = relationship("Material")

# Additional Project Preparation Models

class ProjectFile(Base):
    __tablename__ = 'project_files'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey('projects.id', ondelete='CASCADE'), nullable=False)
    type = Column(Text, nullable=False)
    file_url = Column(Text, nullable=False)
    filename = Column(Text)
    version = Column(Text, default='1.0')
    uploaded_by = Column(UUID(as_uuid=True), ForeignKey('users.id'))
    uploaded_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    project = relationship("Project")
    uploader = relationship("User")
    
    __table_args__ = (
        CheckConstraint("type IN ('traffic_plan','utility_plan','site_plan','contract','permit','other')", name='check_file_type'),
    )

class UtilityContact(Base):
    __tablename__ = 'utility_contacts'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey('projects.id', ondelete='CASCADE'), nullable=False)
    kind = Column(Text, nullable=False)
    org_name = Column(Text, nullable=False)
    phone = Column(Text)
    email = Column(Text)
    contact_person = Column(Text)
    notes = Column(Text)
    
    # Relationships
    project = relationship("Project")
    
    __table_args__ = (
        CheckConstraint("kind IN ('power','water','gas','telecom','road','municipality','emergency')", name='check_utility_kind'),
    )

class PlanViewConfirm(Base):
    __tablename__ = 'plan_view_confirms'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey('projects.id', ondelete='CASCADE'), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=False)
    segment_id = Column(UUID(as_uuid=True), ForeignKey('segments.id'), nullable=True)
    street_name = Column(Text)
    viewed_at = Column(DateTime, default=datetime.utcnow)
    confirmed = Column(Boolean, default=True)
    
    # Relationships
    project = relationship("Project")
    user = relationship("User")
    segment = relationship("Segment")

class Constraint(Base):
    __tablename__ = 'constraints'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey('projects.id', ondelete='CASCADE'), nullable=False)
    segment_id = Column(UUID(as_uuid=True), ForeignKey('segments.id'), nullable=True)
    kind = Column(Text, nullable=False)
    description = Column(Text)
    geom = Column(JSONB)
    status = Column(Text, default='identified')
    resolved_at = Column(DateTime)
    resolved_by = Column(UUID(as_uuid=True), ForeignKey('users.id'))
    
    # Relationships
    project = relationship("Project")
    segment = relationship("Segment")
    resolver = relationship("User")
    
    __table_args__ = (
        CheckConstraint("kind IN ('LSA','steel_plate','fire_access','parking','tree','utility_conflict','access_restriction')", name='check_constraint_kind'),
        CheckConstraint("status IN ('identified','in_progress','resolved','cancelled')", name='check_constraint_status'),
    )

# Removed duplicate StageDef - keeping the first enhanced one

class CutStage(Base):
    __tablename__ = 'cut_stages'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    cut_id = Column(UUID(as_uuid=True), ForeignKey('cuts.id', ondelete='CASCADE'), nullable=False)
    stage_code = Column(Text, nullable=False)
    status = Column(Text, default='open')
    started_at = Column(DateTime)
    closed_at = Column(DateTime)
    closed_by = Column(UUID(as_uuid=True), ForeignKey('users.id'))
    photos_count = Column(Integer, default=0)
    density_tests_count = Column(Integer, default=0)
    
    # Relationships
    cut = relationship("Cut")
    closer = relationship("User")
    
    __table_args__ = (
        CheckConstraint("status IN ('open','in_progress','completed','blocked')", name='check_cut_stage_status'),
    )

class PriceList(Base):
    __tablename__ = 'price_lists'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey('projects.id', ondelete='CASCADE'), nullable=False)
    name = Column(Text, nullable=False)
    valid_from = Column(Date, default=date.today)
    valid_to = Column(Date)
    is_active = Column(Boolean, default=True)
    
    # Relationships
    project = relationship("Project")
    rules = relationship("PriceRule", back_populates="price_list")

class PriceRule(Base):
    __tablename__ = 'price_rules'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    price_list_id = Column(UUID(as_uuid=True), ForeignKey('price_lists.id', ondelete='CASCADE'), nullable=False)
    surface = Column(Text, nullable=False)
    depth_band = Column(Text, nullable=False)
    rate_per_m = Column(Numeric(12, 2), nullable=False)
    
    # Relationships
    price_list = relationship("PriceList", back_populates="rules")
    
    __table_args__ = (
        CheckConstraint("surface IN ('asphalt','concrete','dirt','grass','paving')", name='check_price_surface'),
        CheckConstraint("depth_band IN ('0-50cm','50-80cm','80-120cm','120cm+')", name='check_price_depth'),
    )

class PriceExtra(Base):
    __tablename__ = 'price_extras'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    price_list_id = Column(UUID(as_uuid=True), ForeignKey('price_lists.id', ondelete='CASCADE'), nullable=False)
    type = Column(Text, nullable=False)
    description = Column(Text, nullable=False)
    unit = Column(Text, nullable=False)
    rate = Column(Numeric(12, 2), nullable=False)
    
    # Relationships
    price_list = relationship("PriceList")
    
    __table_args__ = (
        CheckConstraint("type IN ('LSA','steel_plate','debris_removal','traffic_management','weekend_surcharge')", name='check_extra_type'),
        CheckConstraint("unit IN ('per_m','per_piece','per_day','per_hour','lump_sum')", name='check_extra_unit'),
    )

# Company Warehouse Model
class CompanyWarehouse(Base):
    __tablename__ = 'company_warehouse'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    material_id = Column(UUID(as_uuid=True), ForeignKey('materials.id', ondelete='CASCADE'), nullable=False, unique=True)
    total_qty = Column(Numeric(14, 3), nullable=False, default=0)
    reserved_qty = Column(Numeric(14, 3), nullable=False, default=0)
    min_stock_level = Column(Numeric(14, 3), default=0)
    last_updated = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    material = relationship("Material")
    
    @property
    def available_qty(self):
        return float(self.total_qty - self.reserved_qty) if self.total_qty and self.reserved_qty else 0

# Material Allocations Model
class MaterialAllocation(Base):
    __tablename__ = 'material_allocations'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    material_id = Column(UUID(as_uuid=True), ForeignKey('materials.id'), nullable=False)
    project_id = Column(UUID(as_uuid=True), ForeignKey('projects.id'), nullable=True)
    crew_id = Column(UUID(as_uuid=True), ForeignKey('crews.id'), nullable=True)
    allocated_qty = Column(Numeric(14, 3), nullable=False)
    used_qty = Column(Numeric(14, 3), default=0)
    allocation_date = Column(Date, nullable=False, default=datetime.now().date())
    return_date = Column(Date, nullable=True)
    status = Column(Text, nullable=False, default='allocated')
    notes = Column(Text)
    allocated_by = Column(UUID(as_uuid=True), ForeignKey('users.id'))
    
    # Relationships
    material = relationship("Material")
    project = relationship("Project")
    crew = relationship("Crew")
    allocator = relationship("User")
    
    __table_args__ = (
        CheckConstraint("status IN ('allocated', 'partially_used', 'fully_used', 'returned')", name='check_allocation_status'),
        CheckConstraint("project_id IS NOT NULL OR crew_id IS NOT NULL", name='check_allocation_target'),
    )

# Resource Usage Model
class ResourceUsage(Base):
    __tablename__ = 'resource_usage'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    resource_type = Column(Text, nullable=False)  # 'material', 'equipment', 'vehicle'
    resource_id = Column(UUID(as_uuid=True), nullable=False)
    project_id = Column(UUID(as_uuid=True), ForeignKey('projects.id'), nullable=True)
    crew_id = Column(UUID(as_uuid=True), ForeignKey('crews.id'), nullable=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=True)
    usage_date = Column(Date, nullable=False, default=datetime.now().date())
    quantity_used = Column(Numeric(14, 3))
    hours_used = Column(Numeric(10, 2))
    cost_eur = Column(Numeric(12, 2))
    notes = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    project = relationship("Project")
    crew = relationship("Crew")
    user = relationship("User")
    
    __table_args__ = (
        CheckConstraint("resource_type IN ('material', 'equipment', 'vehicle')", name='check_resource_type'),
    )

class ResourceRequest(Base):
    __tablename__ = 'resource_requests'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    request_type = Column(Text, nullable=False)  # 'material' or 'equipment'
    requested_by = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=False)
    project_id = Column(UUID(as_uuid=True), ForeignKey('projects.id'))
    crew_id = Column(UUID(as_uuid=True), ForeignKey('crews.id'))
    item_name = Column(Text)
    material_id = Column(UUID(as_uuid=True), ForeignKey('materials.id'))
    equipment_id = Column(UUID(as_uuid=True), ForeignKey('equipment.id'))
    quantity = Column(Numeric(14, 3), nullable=False)
    unit = Column(Text)
    urgency = Column(Text, nullable=False, default='normal')
    reason = Column(Text, nullable=False)
    description = Column(Text)
    delivery_location = Column(Text)
    needed_by_date = Column(Date)
    status = Column(Text, nullable=False, default='pending')
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    approved_by = Column(UUID(as_uuid=True), ForeignKey('users.id'))
    approved_at = Column(DateTime)
    processed_at = Column(DateTime)
    shipped_at = Column(DateTime)
    delivered_at = Column(DateTime)
    rejected_reason = Column(Text)
    notes = Column(Text)
    admin_notes = Column(Text)
    estimated_cost = Column(Numeric(12, 2))
    actual_cost = Column(Numeric(12, 2))
    
    # Relationships
    user = relationship("User", foreign_keys=[requested_by])
    approver = relationship("User", foreign_keys=[approved_by])
    project = relationship("Project")
    crew = relationship("Crew")
    material = relationship("Material")
    equipment = relationship("Equipment")
    
    __table_args__ = (
        CheckConstraint("request_type IN ('material','equipment')", name='check_request_type'),
        CheckConstraint("urgency IN ('low','normal','high','critical')", name='check_urgency'),
        CheckConstraint("status IN ('pending','approved','rejected','processing','shipped','delivered','cancelled')", name='check_request_status'),
    )

# Supplier Materials Model - material pricing extension for existing suppliers
class SupplierMaterial(Base):
    __tablename__ = 'supplier_materials'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    supplier_id = Column(UUID(as_uuid=True), ForeignKey('suppliers.id'), nullable=False)
    project_id = Column(UUID(as_uuid=True), ForeignKey('projects.id'), nullable=True)
    material_type = Column(Text, nullable=False)  # sand, asphalt, gravel, concrete
    unit = Column(Text, nullable=False, default='ton')  # ton, m3, kg
    unit_price_eur = Column(Numeric(12, 2), nullable=False)
    currency = Column(Text, nullable=False, default='EUR')
    has_delivery = Column(Boolean, default=True)
    delivery_cost_eur = Column(Numeric(12, 2), default=0)
    pickup_address = Column(Text)  # Address for pickup when no delivery
    min_order_quantity = Column(Numeric(14, 3), default=0)
    notes = Column(Text)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    created_by = Column(UUID(as_uuid=True), ForeignKey('users.id'))

    # Relationships
    supplier = relationship("Supplier")
    project = relationship("Project")
    creator = relationship("User")
    orders = relationship("MaterialOrder", back_populates="supplier_material")

    __table_args__ = (
        CheckConstraint("unit IN ('ton','m3','kg','piece','meter','liter','box','pallet')", name='check_supplier_unit'),
        CheckConstraint("currency = 'EUR'", name='check_currency'),
    )

# Document Management Models
class DocumentCategory(Base):
    __tablename__ = 'document_categories'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    code = Column(Text, nullable=False, unique=True)
    name_de = Column(Text, nullable=False)
    name_ru = Column(Text, nullable=False)
    name_en = Column(Text)
    description = Column(Text)
    icon = Column(Text, default='📄')
    color = Column(Text, default='#007bff')
    required_for_work = Column(Boolean, default=False)
    max_validity_years = Column(Integer)
    renewal_notice_days = Column(Integer, default=30)
    required_fields = Column(JSONB)  # JSON array of required field names
    created_at = Column(DateTime, default=datetime.now)

    __table_args__ = (
        CheckConstraint("code IN ('WORK_PERMIT','RESIDENCE_PERMIT','PASSPORT','VISA','HEALTH_INSURANCE','DRIVER_LICENSE','QUALIFICATION_CERT','OTHER')",
                       name='check_document_category_code'),
    )

class WorkerDocument(Base):
    __tablename__ = 'worker_documents'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    category_id = Column(UUID(as_uuid=True), ForeignKey('document_categories.id'), nullable=False)
    document_type = Column(Text, nullable=False)  # Legacy field for existing schema compatibility
    document_number = Column(Text)
    issuing_authority = Column(Text)
    issue_date = Column(Date)
    expiry_date = Column(Date)
    file_url = Column(Text, nullable=False)  # Legacy field for existing schema
    file_path = Column(Text)  # Path to encrypted file
    file_name = Column(Text)
    file_size = Column(Integer)
    file_hash = Column(Text)  # SHA256 hash for integrity check
    mime_type = Column(Text)
    encrypted = Column(Boolean, default=True)
    status = Column(Text, default='active')
    notes = Column(Text)
    verified_at = Column(DateTime)
    verified_by = Column(UUID(as_uuid=True), ForeignKey('users.id'))
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)
    uploaded_by = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=False)

    # Relationships
    user = relationship("User", foreign_keys=[user_id])
    category = relationship("DocumentCategory")
    verifier = relationship("User", foreign_keys=[verified_by])
    uploader = relationship("User", foreign_keys=[uploaded_by])

    __table_args__ = (
        CheckConstraint("status IN ('active','pending_verification','expired','archived','rejected')",
                       name='check_worker_document_status'),
    )

class DocumentReminder(Base):
    __tablename__ = 'document_reminders'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    document_id = Column(UUID(as_uuid=True), ForeignKey('worker_documents.id', ondelete='CASCADE'), nullable=False)
    reminder_date = Column(Date, nullable=False)
    reminder_type = Column(Text, default='expiry')
    days_before_expiry = Column(Integer)
    sent_at = Column(DateTime)
    notification_method = Column(Text, default='email')
    message = Column(Text)
    status = Column(Text, default='pending')

    # Relationships
    document = relationship("WorkerDocument")

    __table_args__ = (
        CheckConstraint("reminder_type IN ('expiry','renewal','verification','custom')",
                       name='check_reminder_type'),
        CheckConstraint("notification_method IN ('email','sms','system')",
                       name='check_notification_method'),
        CheckConstraint("status IN ('pending','sent','failed')",
                       name='check_reminder_status'),
    )



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
