import { NextRequest, NextResponse } from 'next/server';

// Mock suppliers data
const mockSuppliers = [
  {
    id: "sup-001",
    name: "FiberTech Solutions",
    contact_person: "Michael Schmidt",
    email: "m.schmidt@fibertech.de",
    phone: "+49 30 555-0100",
    address: {
      street: "Industriestraße 45",
      city: "Berlin",
      postal_code: "10317",
      country: "Germany"
    },
    categories: ["Cables", "Infrastructure"],
    payment_terms: "Net 30",
    delivery_time_days: 7,
    min_order_amount: 1000,
    rating: 4.8,
    is_active: true,
    contract_start: "2024-01-01",
    contract_end: "2024-12-31",
    notes: "Primary supplier for fiber optic cables and infrastructure",
    created_at: "2024-01-01T10:00:00Z",
    updated_at: "2024-09-20T14:30:00Z"
  },
  {
    id: "sup-002",
    name: "Network Hardware Ltd",
    contact_person: "Sarah Johnson",
    email: "s.johnson@nethw.co.uk",
    phone: "+44 20 7123 4567",
    address: {
      street: "Tech Park Road 15",
      city: "London",
      postal_code: "E14 5AB",
      country: "United Kingdom"
    },
    categories: ["Hardware", "Equipment"],
    payment_terms: "Net 45",
    delivery_time_days: 14,
    min_order_amount: 500,
    rating: 4.6,
    is_active: true,
    contract_start: "2024-02-01",
    contract_end: "2025-01-31",
    notes: "Specialized in network hardware and splice enclosures",
    created_at: "2024-02-01T09:00:00Z",
    updated_at: "2024-09-18T11:45:00Z"
  },
  {
    id: "sup-003",
    name: "Precision Connectors Inc",
    contact_person: "Hans Mueller",
    email: "h.mueller@precision-conn.com",
    phone: "+49 89 777-0200",
    address: {
      street: "Connectorstraße 12",
      city: "Munich",
      postal_code: "80331",
      country: "Germany"
    },
    categories: ["Connectors", "Supplies"],
    payment_terms: "Net 15",
    delivery_time_days: 5,
    min_order_amount: 200,
    rating: 4.9,
    is_active: true,
    contract_start: "2024-01-15",
    contract_end: "2024-12-31",
    notes: "High-quality fiber connectors and cleaning supplies",
    created_at: "2024-01-15T11:00:00Z",
    updated_at: "2024-09-19T16:20:00Z"
  },
  {
    id: "sup-004",
    name: "Industrial Tools GmbH",
    contact_person: "Klaus Weber",
    email: "k.weber@industrialtools.de",
    phone: "+49 40 888-0300",
    address: {
      street: "Werkzeugallee 8",
      city: "Hamburg",
      postal_code: "20459",
      country: "Germany"
    },
    categories: ["Tools", "Equipment"],
    payment_terms: "Net 30",
    delivery_time_days: 10,
    min_order_amount: 300,
    rating: 4.5,
    is_active: true,
    contract_start: "2024-03-01",
    contract_end: "2025-02-28",
    notes: "Excavation tools and construction equipment",
    created_at: "2024-03-01T10:00:00Z",
    updated_at: "2024-09-16T14:45:00Z"
  }
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const is_active = searchParams.get('is_active');
    const city = searchParams.get('city');

    let filteredSuppliers = mockSuppliers;

    // Filter by category
    if (category) {
      filteredSuppliers = filteredSuppliers.filter(supplier =>
        supplier.categories.some(cat =>
          cat.toLowerCase().includes(category.toLowerCase())
        )
      );
    }

    // Filter by active status
    if (is_active !== null) {
      const activeStatus = is_active === 'true';
      filteredSuppliers = filteredSuppliers.filter(supplier =>
        supplier.is_active === activeStatus
      );
    }

    // Filter by city
    if (city) {
      filteredSuppliers = filteredSuppliers.filter(supplier =>
        supplier.address.city.toLowerCase().includes(city.toLowerCase())
      );
    }

    return NextResponse.json(filteredSuppliers);
  } catch (error) {
    console.error('Suppliers API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch suppliers' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const newSupplier = {
      id: `sup-${Date.now()}`,
      ...body,
      is_active: true,
      rating: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    return NextResponse.json(newSupplier, { status: 201 });
  } catch (error) {
    console.error('Create supplier error:', error);
    return NextResponse.json(
      { error: 'Failed to create supplier' },
      { status: 500 }
    );
  }
}