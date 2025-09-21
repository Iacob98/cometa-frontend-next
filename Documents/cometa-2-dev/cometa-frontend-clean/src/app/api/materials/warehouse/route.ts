import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Mock data for warehouse materials - in real implementation, fetch from database
    const mockWarehouseMaterials = [
      {
        id: 'mat_001',
        name: 'Fiber Optic Cable (Single Mode)',
        sku: 'FOC-SM-1000',
        unit: 'm',
        description: 'Single-mode fiber optic cable for long-distance transmission',
        available_qty: 8500,
        total_qty: 10000,
        reserved_qty: 1500,
        min_stock: 2000,
        price: 2.50
      },
      {
        id: 'mat_002',
        name: 'Network Cabinet 19"',
        sku: 'NC-19-42U',
        unit: 'piece',
        description: '42U network cabinet for outdoor installation',
        available_qty: 15,
        total_qty: 20,
        reserved_qty: 5,
        min_stock: 5,
        price: 450.00
      },
      {
        id: 'mat_003',
        name: 'Fiber Splice Closures',
        sku: 'FSC-24F',
        unit: 'piece',
        description: '24-fiber splice closure for underground installation',
        available_qty: 75,
        total_qty: 100,
        reserved_qty: 25,
        min_stock: 20,
        price: 85.00
      },
      {
        id: 'mat_004',
        name: 'Underground Conduit',
        sku: 'UC-110MM',
        unit: 'm',
        description: '110mm HDPE underground conduit for fiber protection',
        available_qty: 2500,
        total_qty: 3000,
        reserved_qty: 500,
        min_stock: 500,
        price: 12.50
      },
      {
        id: 'mat_005',
        name: 'Fiber Patch Panels',
        sku: 'FPP-24P',
        unit: 'piece',
        description: '24-port fiber patch panel for rack mounting',
        available_qty: 30,
        total_qty: 40,
        reserved_qty: 10,
        min_stock: 8,
        price: 125.00
      },
      {
        id: 'mat_006',
        name: 'Fiber Optic Connectors (SC/UPC)',
        sku: 'FOC-SC-UPC',
        unit: 'piece',
        description: 'SC/UPC single-mode fiber optic connectors',
        available_qty: 500,
        total_qty: 1000,
        reserved_qty: 500,
        min_stock: 200,
        price: 3.75
      }
    ];

    // Filter out materials with no available quantity
    const availableMaterials = mockWarehouseMaterials.filter(material => material.available_qty > 0);

    return NextResponse.json(availableMaterials);

  } catch (error) {
    console.error('Warehouse materials API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch warehouse materials' },
      { status: 500 }
    );
  }
}