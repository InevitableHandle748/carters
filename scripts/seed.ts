import { PrismaClient, UserRole, StoreSize, RequestStatus, RequestType, Priority } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // --- USERS ---
  const hashedPassword = await bcrypt.hash('johndoe123', 10);
  const hashedPass2 = await bcrypt.hash('carter2024', 10);

  const adminUser = await prisma.user.upsert({
    where: { email: 'john@doe.com' },
    update: {},
    create: { email: 'john@doe.com', name: 'John Admin', password: hashedPassword, role: 'ADMIN' },
  });

  const adminUser2 = await prisma.user.upsert({
    where: { email: 'admin@carters.com' },
    update: {},
    create: { email: 'admin@carters.com', name: 'Sarah Mitchell', password: hashedPass2, role: 'ADMIN' },
  });

  const fulfiller1 = await prisma.user.upsert({
    where: { email: 'fulfiller@carters.com' },
    update: {},
    create: { email: 'fulfiller@carters.com', name: 'Mike Johnson', password: hashedPass2, role: 'FULFILLER' },
  });

  const fulfiller2 = await prisma.user.upsert({
    where: { email: 'warehouse@carters.com' },
    update: {},
    create: { email: 'warehouse@carters.com', name: 'Lisa Chen', password: hashedPass2, role: 'FULFILLER' },
  });

  const requester1 = await prisma.user.upsert({
    where: { email: 'requester@carters.com' },
    update: {},
    create: { email: 'requester@carters.com', name: 'David Park', password: hashedPass2, role: 'REQUESTER' },
  });

  const requester2 = await prisma.user.upsert({
    where: { email: 'store.manager@carters.com' },
    update: {},
    create: { email: 'store.manager@carters.com', name: 'Jennifer Lopez', password: hashedPass2, role: 'REQUESTER' },
  });

  const requester3 = await prisma.user.upsert({
    where: { email: 'ops@carters.com' },
    update: {},
    create: { email: 'ops@carters.com', name: 'Robert Williams', password: hashedPass2, role: 'REQUESTER' },
  });

  // --- REAL USER ACCOUNTS ---
  const hashedRealPass1 = await bcrypt.hash('Steph@Carter2026!', 10);
  const hashedRealPass2 = await bcrypt.hash('Charles#Wach2026', 10);
  const hashedRealPass3 = await bcrypt.hash('MarcSteven!2026x', 10);
  const hashedRealPass4 = await bcrypt.hash('KenLewis@Port2026', 10);
  const hashedRealPass5 = await bcrypt.hash('Eniko#Wachter2026', 10);

  await prisma.user.upsert({
    where: { email: 'stephanie.lane@carters.com' },
    update: {},
    create: { email: 'stephanie.lane@carters.com', name: 'Stephanie Lane', password: hashedRealPass1, role: 'REQUESTER' },
  });
  await prisma.user.upsert({
    where: { email: 'charles.weller@carters.com' },
    update: {},
    create: { email: 'charles.weller@carters.com', name: 'Charles Weller', password: hashedRealPass2, role: 'REQUESTER' },
  });
  await prisma.user.upsert({
    where: { email: 'marc.stevenin@carters.com' },
    update: {},
    create: { email: 'marc.stevenin@carters.com', name: 'Marc Stevenin', password: hashedRealPass3, role: 'REQUESTER' },
  });
  await prisma.user.upsert({
    where: { email: 'ken.lewis@carters.com' },
    update: {},
    create: { email: 'ken.lewis@carters.com', name: 'Ken Lewis', password: hashedRealPass4, role: 'REQUESTER' },
  });
  await prisma.user.upsert({
    where: { email: 'eniko.geczo@wachter.com' },
    update: {},
    create: { email: 'eniko.geczo@wachter.com', name: 'Eniko Geczo', password: hashedRealPass5, role: 'REQUESTER' },
  });

  console.log('Users seeded.');

  // --- STORES ---
  const stores = [
    { siteNumber: 'CTR-001', name: "Carter's Atlanta Flagship", address: '1200 Peachtree St NE', city: 'Atlanta', state: 'GA', zip: '30309', size: 'LARGE' as StoreSize },
    { siteNumber: 'CTR-002', name: "Carter's Buckhead", address: '3500 Peachtree Rd NE', city: 'Atlanta', state: 'GA', zip: '30326', size: 'MEDIUM' as StoreSize },
    { siteNumber: 'CTR-003', name: "Carter's Mall of Georgia", address: '3333 Buford Dr', city: 'Buford', state: 'GA', zip: '30519', size: 'LARGE' as StoreSize },
    { siteNumber: 'CTR-004', name: "Carter's Perimeter Mall", address: '4400 Ashford Dunwoody Rd', city: 'Dunwoody', state: 'GA', zip: '30346', size: 'MEDIUM' as StoreSize },
    { siteNumber: 'CTR-005', name: "Carter's Lenox Square", address: '3393 Peachtree Rd NE', city: 'Atlanta', state: 'GA', zip: '30326', size: 'SMALL' as StoreSize },
    { siteNumber: 'CTR-006', name: "Carter's North Point Mall", address: '1000 North Point Cir', city: 'Alpharetta', state: 'GA', zip: '30022', size: 'MEDIUM' as StoreSize },
    { siteNumber: 'CTR-007', name: "Carter's Town Center", address: '400 Ernest Barrett Pkwy', city: 'Kennesaw', state: 'GA', zip: '30144', size: 'SMALL' as StoreSize },
    { siteNumber: 'CTR-008', name: "Carter's Southlake Mall", address: '1000 Southlake Mall', city: 'Morrow', state: 'GA', zip: '30260', size: 'SMALL' as StoreSize },
    { siteNumber: 'CTR-009', name: "Carter's Cumberland Mall", address: '1189 Cumberland Mall', city: 'Atlanta', state: 'GA', zip: '30339', size: 'LARGE' as StoreSize },
    { siteNumber: 'CTR-010', name: "Carter's Discover Mills", address: '5900 Sugarloaf Pkwy', city: 'Lawrenceville', state: 'GA', zip: '30043', size: 'MEDIUM' as StoreSize },
    { siteNumber: 'CTR-011', name: "Carter's Stonecrest", address: '2929 Turner Hill Rd', city: 'Lithonia', state: 'GA', zip: '30038', size: 'SMALL' as StoreSize },
    { siteNumber: 'CTR-012', name: "Carter's Sugarloaf Mills", address: '5900 Sugarloaf Pkwy Ste 100', city: 'Lawrenceville', state: 'GA', zip: '30043', size: 'LARGE' as StoreSize },
    { siteNumber: 'CTR-013', name: "Carter's Avalon", address: '400 Avalon Blvd', city: 'Alpharetta', state: 'GA', zip: '30009', size: 'MEDIUM' as StoreSize },
    { siteNumber: 'CTR-014', name: "Carter's The Forum", address: '5155 Peachtree Pkwy', city: 'Peachtree Corners', state: 'GA', zip: '30092', size: 'SMALL' as StoreSize },
    { siteNumber: 'CTR-015', name: "Carter's Outlet Shoppes", address: '915 Ridgewalk Pkwy', city: 'Woodstock', state: 'GA', zip: '30188', size: 'MEDIUM' as StoreSize },
  ];

  const createdStores: any[] = [];
  for (const s of stores) {
    const store = await prisma.store.upsert({
      where: { siteNumber: s.siteNumber },
      update: {},
      create: s,
    });
    createdStores.push(store);
  }
  console.log('Stores seeded.');

  // --- PRODUCTS ---
  const products = [
    // POS Systems
    { name: 'Zebra TC52 POS Terminal', sku: 'POS-TC52', description: 'Zebra TC52 handheld POS terminal with barcode scanner', category: 'POS Systems', unitPrice: 1299.99, inStock: 150 },
    { name: 'Zebra TC72 POS Terminal', sku: 'POS-TC72', description: 'Zebra TC72 premium POS terminal with extended range', category: 'POS Systems', unitPrice: 1599.99, inStock: 80 },
    { name: 'NCR Silver POS Register', sku: 'POS-NCR01', description: 'NCR Silver all-in-one POS register system', category: 'POS Systems', unitPrice: 2499.99, inStock: 45 },
    { name: 'Square Terminal', sku: 'POS-SQ01', description: 'Square payment terminal for card transactions', category: 'POS Systems', unitPrice: 399.99, inStock: 200 },
    // Scanners
    { name: 'Zebra DS3608 Barcode Scanner', sku: 'SCN-DS3608', description: 'Ultra-rugged 1D/2D barcode scanner', category: 'Scanners', unitPrice: 549.99, inStock: 120 },
    { name: 'Honeywell Voyager 1472g', sku: 'SCN-HW1472', description: 'General purpose 2D barcode scanner', category: 'Scanners', unitPrice: 249.99, inStock: 180 },
    { name: 'Zebra LI3608 Scanner', sku: 'SCN-LI3608', description: 'Ultra-rugged linear scanner', category: 'Scanners', unitPrice: 399.99, inStock: 90 },
    // Printers
    { name: 'Zebra ZT411 Label Printer', sku: 'PRT-ZT411', description: 'Industrial thermal transfer label printer', category: 'Printers', unitPrice: 1899.99, inStock: 60 },
    { name: 'Epson TM-T88VI Receipt Printer', sku: 'PRT-EP88', description: 'Thermal receipt printer with USB/Ethernet', category: 'Printers', unitPrice: 449.99, inStock: 100 },
    { name: 'Brother QL-820NWB Label Printer', sku: 'PRT-BQ820', description: 'Professional wireless label printer', category: 'Printers', unitPrice: 299.99, inStock: 75 },
    { name: 'Zebra ZD421 Desktop Printer', sku: 'PRT-ZD421', description: 'Compact desktop thermal printer', category: 'Printers', unitPrice: 599.99, inStock: 85 },
    // Computers & Tablets
    { name: 'Zebra ET51 Tablet', sku: 'TAB-ET51', description: 'Enterprise-grade Windows tablet 10-inch', category: 'Tablets', unitPrice: 1799.99, inStock: 70 },
    { name: 'ET51 Smartback Battery', sku: 'TAB-ET51SB', description: 'Expansion back for ET51 with extended battery', category: 'Tablets', unitPrice: 299.99, inStock: 50 },
    { name: 'iPad Mini 6th Gen', sku: 'TAB-IPADM6', description: 'Apple iPad Mini for store gaming/demo stations', category: 'Tablets', unitPrice: 499.99, inStock: 90 },
    { name: 'iPad Otterbox Case', sku: 'ACC-IPDCASE', description: 'Otterbox Defender case for iPad Mini', category: 'Accessories', unitPrice: 69.99, inStock: 120 },
    { name: 'iPad Charging Cable', sku: 'ACC-IPDCBL', description: 'Lightning to USB-C charging cable 6ft', category: 'Accessories', unitPrice: 24.99, inStock: 300 },
    { name: 'iPad Shoulder Strap Mount', sku: 'ACC-IPDSTRAP', description: 'Adjustable shoulder strap with iPad mount', category: 'Accessories', unitPrice: 49.99, inStock: 80 },
    { name: 'Dell OptiPlex 7090 Desktop', sku: 'PC-DELL7090', description: 'Dell OptiPlex 7090 Micro Form Factor desktop', category: 'Computers', unitPrice: 1099.99, inStock: 40 },
    { name: 'Dell 24" Monitor P2422H', sku: 'MON-DELLP24', description: 'Dell 24-inch FHD IPS monitor', category: 'Computers', unitPrice: 279.99, inStock: 55 },
    // Networking
    { name: 'Cisco Meraki MR36 AP', sku: 'NET-MR36', description: 'Cloud-managed WiFi 6 access point', category: 'Networking', unitPrice: 799.99, inStock: 60 },
    { name: 'Cisco Catalyst 9200L Switch', sku: 'NET-C9200L', description: '24-port PoE+ managed switch', category: 'Networking', unitPrice: 2299.99, inStock: 30 },
    { name: 'Cat5e Ethernet Cable 5ft', sku: 'NET-CAT5E5', description: "5-foot Cat5e Ethernet patch cable", category: 'Networking', unitPrice: 4.99, inStock: 500 },
    { name: 'Cat6 Ethernet Cable 25ft', sku: 'NET-CAT625', description: '25-foot Cat6 Ethernet cable', category: 'Networking', unitPrice: 12.99, inStock: 300 },
    { name: 'Cisco Meraki MX67 Firewall', sku: 'NET-MX67', description: 'Cloud-managed security appliance', category: 'Networking', unitPrice: 1499.99, inStock: 25 },
    // Security
    { name: 'Axis M3065-V Dome Camera', sku: 'SEC-AXM30', description: 'Indoor fixed dome network camera 1080p', category: 'Security', unitPrice: 399.99, inStock: 100 },
    { name: 'Axis P3245-V Dome Camera', sku: 'SEC-AXP32', description: 'Indoor/outdoor dome camera with WDR', category: 'Security', unitPrice: 649.99, inStock: 60 },
    { name: 'Milestone XProtect NVR', sku: 'SEC-MSNVR', description: 'Network video recorder 16-channel', category: 'Security', unitPrice: 2999.99, inStock: 20 },
    { name: 'Security Cable Kit', sku: 'SEC-CBLKIT', description: 'Camera cabling kit with connectors', category: 'Security', unitPrice: 89.99, inStock: 150 },
    // Payment
    { name: 'Verifone M400 Pin Pad', sku: 'PAY-M400', description: 'Verifone M400 touchscreen payment terminal', category: 'Payment', unitPrice: 599.99, inStock: 100 },
    { name: 'M400 Pin Pad Mount', sku: 'PAY-M400MT', description: 'Countertop mount for M400 pin pad', category: 'Payment', unitPrice: 49.99, inStock: 120 },
    { name: 'M400 Power Cable', sku: 'PAY-M400PW', description: 'Power supply cable for M400 pin pad', category: 'Payment', unitPrice: 29.99, inStock: 200 },
    // Fixtures
    { name: 'Cash Drawer APG VB320', sku: 'FIX-CASHDW', description: 'APG Vasario cash drawer 16x16', category: 'Fixtures', unitPrice: 149.99, inStock: 70 },
    { name: 'Register Stand', sku: 'FIX-REGSTD', description: 'Ergonomic register stand with cable management', category: 'Fixtures', unitPrice: 199.99, inStock: 50 },
    { name: 'Gaming Table Display', sku: 'FIX-GAMETBL', description: 'Interactive gaming table for kids area', category: 'Fixtures', unitPrice: 899.99, inStock: 15 },
    { name: 'Tablet Kiosk Stand', sku: 'FIX-KIOSK', description: 'Floor-standing tablet kiosk enclosure', category: 'Fixtures', unitPrice: 349.99, inStock: 30 },
    // Supplies
    { name: 'Thermal Receipt Paper (50 rolls)', sku: 'SUP-RCPTPPR', description: '3-1/8 x 230ft thermal receipt paper rolls', category: 'Supplies', unitPrice: 89.99, inStock: 400 },
    { name: 'Label Stock 4x6 (1000ct)', sku: 'SUP-LBL4X6', description: '4x6 inch direct thermal labels', category: 'Supplies', unitPrice: 34.99, inStock: 350 },
    { name: 'UPS Battery Backup 1500VA', sku: 'PWR-UPS1500', description: 'APC Smart-UPS 1500VA battery backup', category: 'Power', unitPrice: 499.99, inStock: 40 },
    { name: 'Power Strip Surge Protector', sku: 'PWR-SURGE8', description: '8-outlet surge protector power strip', category: 'Power', unitPrice: 34.99, inStock: 200 },
    { name: 'Wireless Keyboard & Mouse', sku: 'ACC-KBMS', description: 'Logitech wireless keyboard and mouse combo', category: 'Accessories', unitPrice: 59.99, inStock: 100 },
  ];

  const createdProducts: any[] = [];
  for (const p of products) {
    const product = await prisma.product.upsert({
      where: { sku: p.sku },
      update: {},
      create: p,
    });
    createdProducts.push(product);
  }
  console.log('Products seeded.');

  // helper
  const findProduct = (sku: string) => createdProducts.find((p: any) => p.sku === sku);

  // --- BUNDLES ---
  // Small Store Bundle (10 items)
  const smallBundle = await prisma.bundle.upsert({
    where: { storeSize: 'SMALL' },
    update: {},
    create: { name: 'Small Store Equipment Kit', storeSize: 'SMALL', description: 'Standard equipment package for small format stores (under 3,000 sq ft)' },
  });

  const smallItems = [
    { sku: 'POS-TC52', qty: 2 }, { sku: 'SCN-HW1472', qty: 2 }, { sku: 'PRT-EP88', qty: 2 },
    { sku: 'PAY-M400', qty: 2 }, { sku: 'PAY-M400MT', qty: 2 }, { sku: 'PAY-M400PW', qty: 2 },
    { sku: 'NET-MR36', qty: 1 }, { sku: 'NET-C9200L', qty: 1 }, { sku: 'SEC-AXM30', qty: 4 },
    { sku: 'FIX-CASHDW', qty: 2 },
  ];
  for (const item of smallItems) {
    const prod = findProduct(item.sku);
    if (prod) {
      await prisma.bundleItem.upsert({
        where: { bundleId_productId: { bundleId: smallBundle.id, productId: prod.id } },
        update: {},
        create: { bundleId: smallBundle.id, productId: prod.id, quantity: item.qty },
      });
    }
  }

  // Medium Store Bundle (18 items)
  const medBundle = await prisma.bundle.upsert({
    where: { storeSize: 'MEDIUM' },
    update: {},
    create: { name: 'Medium Store Equipment Kit', storeSize: 'MEDIUM', description: 'Standard equipment package for medium format stores (3,000-6,000 sq ft)' },
  });

  const medItems = [
    { sku: 'POS-TC52', qty: 3 }, { sku: 'POS-NCR01', qty: 1 }, { sku: 'SCN-DS3608', qty: 3 },
    { sku: 'SCN-HW1472', qty: 2 }, { sku: 'PRT-EP88', qty: 3 }, { sku: 'PRT-ZD421', qty: 1 },
    { sku: 'PAY-M400', qty: 3 }, { sku: 'PAY-M400MT', qty: 3 }, { sku: 'PAY-M400PW', qty: 3 },
    { sku: 'NET-MR36', qty: 2 }, { sku: 'NET-C9200L', qty: 1 }, { sku: 'NET-MX67', qty: 1 },
    { sku: 'SEC-AXM30', qty: 6 }, { sku: 'SEC-AXP32', qty: 2 }, { sku: 'FIX-CASHDW', qty: 3 },
    { sku: 'FIX-REGSTD', qty: 3 }, { sku: 'TAB-IPADM6', qty: 1 }, { sku: 'ACC-IPDCASE', qty: 1 },
  ];
  for (const item of medItems) {
    const prod = findProduct(item.sku);
    if (prod) {
      await prisma.bundleItem.upsert({
        where: { bundleId_productId: { bundleId: medBundle.id, productId: prod.id } },
        update: {},
        create: { bundleId: medBundle.id, productId: prod.id, quantity: item.qty },
      });
    }
  }

  // Large Store Bundle (28 items)
  const largeBundle = await prisma.bundle.upsert({
    where: { storeSize: 'LARGE' },
    update: {},
    create: { name: 'Large Store Equipment Kit', storeSize: 'LARGE', description: 'Full equipment package for large format stores (over 6,000 sq ft)' },
  });

  const largeItems = [
    { sku: 'POS-TC52', qty: 4 }, { sku: 'POS-TC72', qty: 2 }, { sku: 'POS-NCR01', qty: 2 },
    { sku: 'SCN-DS3608', qty: 4 }, { sku: 'SCN-HW1472', qty: 4 }, { sku: 'SCN-LI3608', qty: 2 },
    { sku: 'PRT-ZT411', qty: 1 }, { sku: 'PRT-EP88', qty: 5 }, { sku: 'PRT-BQ820', qty: 2 },
    { sku: 'PRT-ZD421', qty: 2 }, { sku: 'PAY-M400', qty: 5 }, { sku: 'PAY-M400MT', qty: 5 },
    { sku: 'PAY-M400PW', qty: 5 }, { sku: 'NET-MR36', qty: 4 }, { sku: 'NET-C9200L', qty: 2 },
    { sku: 'NET-MX67', qty: 1 }, { sku: 'NET-CAT5E5', qty: 50 }, { sku: 'NET-CAT625', qty: 20 },
    { sku: 'SEC-AXM30', qty: 10 }, { sku: 'SEC-AXP32', qty: 4 }, { sku: 'SEC-MSNVR', qty: 1 },
    { sku: 'SEC-CBLKIT', qty: 2 }, { sku: 'FIX-CASHDW', qty: 5 }, { sku: 'FIX-REGSTD', qty: 5 },
    { sku: 'FIX-GAMETBL', qty: 1 }, { sku: 'TAB-IPADM6', qty: 2 }, { sku: 'ACC-IPDCASE', qty: 2 },
    { sku: 'PC-DELL7090', qty: 2 },
  ];
  for (const item of largeItems) {
    const prod = findProduct(item.sku);
    if (prod) {
      await prisma.bundleItem.upsert({
        where: { bundleId_productId: { bundleId: largeBundle.id, productId: prod.id } },
        update: {},
        create: { bundleId: largeBundle.id, productId: prod.id, quantity: item.qty },
      });
    }
  }
  console.log('Bundles seeded.');

  // --- SAMPLE REQUESTS ---
  const sampleRequests = [
    {
      caseNumber: 'REQ-2026-0001',
      type: 'NEW_STORE' as RequestType,
      status: 'COMPLETED' as RequestStatus,
      userId: requester1.id,
      storeId: createdStores[0].id,
      storeSize: 'LARGE' as StoreSize,
      installRequested: true,
      notes: 'Flagship store grand opening - all equipment needed by June 1',
      priority: 'HIGH' as Priority,
      items: [{ sku: 'POS-TC52', qty: 4 }, { sku: 'PRT-EP88', qty: 5 }, { sku: 'PAY-M400', qty: 5 }],
    },
    {
      caseNumber: 'REQ-2026-0002',
      type: 'NEW_STORE' as RequestType,
      status: 'APPROVED' as RequestStatus,
      userId: requester2.id,
      storeId: createdStores[1].id,
      storeSize: 'MEDIUM' as StoreSize,
      installRequested: true,
      notes: 'New Buckhead location opening Q3',
      priority: 'MEDIUM' as Priority,
      items: [{ sku: 'POS-TC52', qty: 3 }, { sku: 'SCN-DS3608', qty: 3 }],
    },
    {
      caseNumber: 'REQ-2026-0003',
      type: 'REPLACEMENT' as RequestType,
      status: 'PENDING' as RequestStatus,
      userId: requester1.id,
      storeId: createdStores[4].id,
      installRequested: false,
      notes: 'Replacing damaged receipt printers at Lenox Square',
      priority: 'MEDIUM' as Priority,
      items: [{ sku: 'PRT-EP88', qty: 2 }, { sku: 'SUP-RCPTPPR', qty: 1 }],
    },
    {
      caseNumber: 'REQ-2026-0004',
      type: 'REPLACEMENT' as RequestType,
      status: 'SHIPPED' as RequestStatus,
      userId: requester3.id,
      storeId: createdStores[6].id,
      installRequested: true,
      notes: 'Scanner malfunction, need replacement ASAP',
      priority: 'URGENT' as Priority,
      items: [{ sku: 'SCN-DS3608', qty: 1 }, { sku: 'SCN-HW1472', qty: 1 }],
    },
    {
      caseNumber: 'REQ-2026-0005',
      type: 'SUPPORT' as RequestType,
      status: 'PENDING' as RequestStatus,
      userId: requester2.id,
      installRequested: false,
      notes: 'Need help with network configuration at store CTR-006',
      priority: 'LOW' as Priority,
      category: 'Network',
      description: 'WiFi access points are dropping connections intermittently. Store staff report that POS terminals lose network connectivity during peak hours.',
    },
    {
      caseNumber: 'REQ-2026-0006',
      type: 'NEW_STORE' as RequestType,
      status: 'PENDING' as RequestStatus,
      userId: requester3.id,
      storeId: createdStores[10].id,
      storeSize: 'SMALL' as StoreSize,
      installRequested: true,
      notes: 'New small format store opening at Stonecrest',
      priority: 'MEDIUM' as Priority,
      items: [{ sku: 'POS-TC52', qty: 2 }, { sku: 'NET-MR36', qty: 1 }],
    },
    {
      caseNumber: 'REQ-2026-0007',
      type: 'REPLACEMENT' as RequestType,
      status: 'CANCELLED' as RequestStatus,
      userId: requester1.id,
      storeId: createdStores[2].id,
      installRequested: false,
      notes: 'Cancelled - found replacement in warehouse',
      priority: 'LOW' as Priority,
      items: [{ sku: 'ACC-KBMS', qty: 3 }],
    },
  ];

  for (const req of sampleRequests) {
    const { items, ...reqData } = req;
    const existing = await prisma.request.findUnique({ where: { caseNumber: req.caseNumber } });
    if (!existing) {
      const created = await prisma.request.create({ data: reqData });
      if (items) {
        for (const item of items) {
          const prod = findProduct(item.sku);
          if (prod) {
            await prisma.requestItem.create({
              data: { requestId: created.id, productId: prod.id, quantity: item.qty, installRequested: req.installRequested },
            });
          }
        }
      }
    }
  }
  console.log('Requests seeded.');

  // --- KNOWLEDGE ARTICLES ---
  const articles = [
    {
      title: 'How to Submit a New Store Equipment Request',
      slug: 'new-store-equipment-request',
      category: 'Equipment Requests',
      content: `<h2>Overview</h2><p>When a new Carter's store location is being opened, the store operations team needs to submit an equipment request to ensure all necessary hardware and technology is delivered and installed before the store opening date.</p><h2>Steps</h2><ol><li><strong>Navigate to New Store Request</strong> - Click "New Store Equipment" from the catalog on your dashboard.</li><li><strong>Select Your Store</strong> - Use the store dropdown to find your store location by site number or name.</li><li><strong>Choose Store Size</strong> - Select Small, Medium, or Large. This will auto-populate the recommended equipment bundle.</li><li><strong>Review Equipment List</strong> - The system will display all items in the bundle with default quantities. You can adjust quantities as needed.</li><li><strong>Add Extra Items</strong> - If you need items not in the standard bundle, click "Add Item" to browse the full stockroom catalog.</li><li><strong>Request Installation</strong> - Check the "Request Install" box if you need on-site installation services.</li><li><strong>Submit</strong> - Review your order and click Submit. A case number will be generated for tracking.</li></ol><h2>What Happens Next</h2><p>Your request will be reviewed by the fulfillment team. You can track the status from your dashboard. You will receive email notifications when the status changes.</p>`,
    },
    {
      title: 'How to Request Replacement Equipment',
      slug: 'replacement-equipment-request',
      category: 'Equipment Requests',
      content: `<h2>Overview</h2><p>If equipment at your store is damaged, malfunctioning, or needs to be replaced, you can submit a replacement request through the portal.</p><h2>Steps</h2><ol><li><strong>Navigate to Replacement Request</strong> - Click "Request Replacement" from the catalog on your dashboard.</li><li><strong>Select Your Store</strong> - Choose the store location where the replacement is needed.</li><li><strong>Browse Equipment</strong> - Search or browse the stockroom inventory to find the items you need.</li><li><strong>Set Quantities</strong> - Specify how many of each item you need replaced.</li><li><strong>Add Notes</strong> - Describe the issue with the current equipment. This helps the fulfillment team prioritize your request.</li><li><strong>Submit</strong> - Your replacement request will be assigned a case number.</li></ol><h2>Priority Levels</h2><ul><li><strong>Urgent</strong> - POS or payment systems down, store cannot process transactions</li><li><strong>High</strong> - Key equipment failure affecting operations</li><li><strong>Medium</strong> - Equipment degraded but functional</li><li><strong>Low</strong> - Cosmetic or minor issues</li></ul>`,
    },
    {
      title: 'Equipment Bundle Guide by Store Size',
      slug: 'bundle-guide',
      category: 'Reference',
      content: `<h2>Store Size Classifications</h2><p>Carter's stores are classified into three size categories, each with a standard equipment bundle:</p><h3>Small Store (Under 3,000 sq ft)</h3><p>Typically located in outlet malls or strip centers. Includes 2 POS terminals, 2 scanners, 2 receipt printers, basic networking, and 4 security cameras.</p><h3>Medium Store (3,000-6,000 sq ft)</h3><p>Standard mall locations. Includes 3-4 POS terminals, 5 scanners, 3 receipt printers, enhanced networking with firewall, 8 security cameras, and a kids' area tablet.</p><h3>Large Store (Over 6,000 sq ft)</h3><p>Flagship and high-traffic locations. Includes 6+ POS terminals, 10 scanners, 7 printers, full networking infrastructure, 14 security cameras with NVR, gaming table, multiple tablets, and back-office computers.</p><h2>Customization</h2><p>All bundles can be customized after auto-population. Add or remove items as needed for your specific store layout and requirements.</p>`,
    },
    {
      title: 'Fulfillment Process and Timeline',
      slug: 'fulfillment-process',
      category: 'Process',
      content: `<h2>Request Lifecycle</h2><p>Every equipment request follows a standard fulfillment process:</p><ol><li><strong>Pending</strong> - Request submitted, awaiting fulfillment team review</li><li><strong>Approved</strong> - Request reviewed and approved, items being prepared for shipment</li><li><strong>Shipped</strong> - Equipment has been shipped to the store location</li><li><strong>Completed</strong> - Equipment received and (if requested) installed at the store</li></ol><h2>Timeline Expectations</h2><ul><li><strong>New Store Orders</strong> - Allow 2-4 weeks from approval to completion</li><li><strong>Replacement Items</strong> - Standard: 5-7 business days. Urgent: 1-3 business days</li><li><strong>Installation</strong> - Add 2-3 business days after equipment delivery</li></ul><h2>Tracking</h2><p>Use your dashboard to track all open requests. Email notifications are sent at each status change.</p>`,
    },
    {
      title: 'General Support Request Guide',
      slug: 'general-support',
      category: 'Support',
      content: `<h2>When to Submit a Support Request</h2><p>Use the General Support form for issues that don't require equipment replacement:</p><ul><li>Network configuration assistance</li><li>Software updates or troubleshooting</li><li>Account access issues</li><li>General IT questions</li><li>Training requests</li></ul><h2>How to Submit</h2><ol><li>Click "General Support" from the catalog</li><li>Select a category (Network, Software, Hardware, Account, Other)</li><li>Set the priority level</li><li>Describe your issue in detail</li><li>Submit to create a support case</li></ol><h2>Response Times</h2><ul><li><strong>Urgent</strong> - Within 2 hours</li><li><strong>High</strong> - Within 4 hours</li><li><strong>Medium</strong> - Within 1 business day</li><li><strong>Low</strong> - Within 3 business days</li></ul>`,
    },
  ];

  for (const article of articles) {
    await prisma.knowledgeArticle.upsert({
      where: { slug: article.slug },
      update: {},
      create: article,
    });
  }
  console.log('Knowledge articles seeded.');

  console.log('Seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
