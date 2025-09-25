#!/usr/bin/env python3
"""
Script to add missing columns found in database to SQLAlchemy models
"""

def update_models_file():
    """Update the models.py file to include missing columns"""

    model_updates = {
        'costs': [
            ('reference_id', 'Column(UUID(as_uuid=True))'),
            ('reference_type', 'Column(Text)')
        ],
        'crews': [
            ('status', 'Column(Text)')
        ],
        'projects': [
            ('approved', 'Column(Boolean, default=False)')
        ],
        'suppliers': [
            ('org_name', 'Column(Text)')
        ],
        'vehicles': [
            ('mileage', 'Column(Numeric(10, 2))'),
            ('vin', 'Column(Text)'),
            ('year_of_manufacture', 'Column(Integer)')
        ],
        'work_entries': [
            ('approved', 'Column(Boolean, default=False)')
        ]
    }

    # Read current models.py file
    with open('/Users/iacob/Documents/cometa-2-dev/shared/models.py', 'r') as f:
        content = f.read()

    print("📝 Updating models.py with missing columns...")

    # Add missing columns to each model class
    for table_name, columns in model_updates.items():
        class_name = get_class_name(table_name)
        print(f"\n🔧 Adding {len(columns)} columns to {class_name} class:")

        for col_name, col_definition in columns:
            print(f"  + {col_name}: {col_definition}")

            # Find the class definition and add column
            class_start = f"class {class_name}(Base):"
            if class_start in content:
                # Find the end of the class (next class or end of file)
                class_pos = content.find(class_start)
                next_class_pos = content.find("\nclass ", class_pos + 1)
                if next_class_pos == -1:
                    next_class_pos = len(content)

                # Find last column definition in the class
                class_content = content[class_pos:next_class_pos]
                last_column_pos = find_last_column_position(class_content)

                if last_column_pos != -1:
                    # Insert new column after last column
                    insert_pos = class_pos + last_column_pos
                    new_column = f"\n    {col_name} = {col_definition}"
                    content = content[:insert_pos] + new_column + content[insert_pos:]

    # Write updated content back to file
    with open('/Users/iacob/Documents/cometa-2-dev/shared/models.py', 'w') as f:
        f.write(content)

    print("\n✅ Successfully updated models.py with missing columns")

def get_class_name(table_name):
    """Convert table name to class name"""
    name_map = {
        'costs': 'Cost',
        'crews': 'Crew',
        'projects': 'Project',
        'suppliers': 'Supplier',
        'vehicles': 'Vehicle',
        'work_entries': 'WorkEntry'
    }
    return name_map.get(table_name, table_name.title())

def find_last_column_position(class_content):
    """Find the position of the last column definition in a class"""
    lines = class_content.split('\n')
    last_column_line = -1

    for i, line in enumerate(lines):
        stripped = line.strip()
        if (' = Column(' in stripped and
            not stripped.startswith('#') and
            not stripped.startswith('__table_args__') and
            not stripped.startswith('# Relationships')):
            last_column_line = i

    if last_column_line != -1:
        # Find the end of this line in the original content
        line_end_pos = 0
        for i in range(last_column_line + 1):
            line_end_pos = class_content.find('\n', line_end_pos) + 1
        return line_end_pos - 1

    return -1

if __name__ == "__main__":
    update_models_file()