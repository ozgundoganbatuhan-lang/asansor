import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Create demo organization
  const org = await prisma.organization.upsert({
    where: { slug: "demo" },
    update: {},
    create: {
      name: "Demo Asansör Servisi",
      slug: "demo",
      vertical: "ELEVATOR",
      planTier: "TRIAL",
    },
  });

  // Create demo user
  const passwordHash = await bcrypt.hash("demo1234", 10);
  const user = await prisma.user.upsert({
    where: { email: "demo@servisim.app" },
    update: {},
    create: {
      organizationId: org.id,
      name: "Demo Kullanıcı",
      email: "demo@servisim.app",
      passwordHash,
      role: "OWNER",
    },
  });

  // Create demo customers
  const customer1 = await prisma.customer.create({
    data: {
      organizationId: org.id,
      name: "Güneş Sitesi Yönetimi",
      contactName: "Ahmet Yılmaz",
      phone: "0212 555 1234",
      email: "yonetim@gunessitesi.com",
      address: "Beşiktaş, İstanbul",
    },
  });

  const customer2 = await prisma.customer.create({
    data: {
      organizationId: org.id,
      name: "Park Tower AVM",
      contactName: "Fatma Kaya",
      phone: "0216 444 5678",
      email: "teknik@parktower.com",
      address: "Kadıköy, İstanbul",
    },
  });

  // Create demo technicians
  const tech1 = await prisma.technician.create({
    data: {
      organizationId: org.id,
      name: "Mehmet Demir",
      initials: "MD",
      phone: "0530 111 2222",
      zone: "Avrupa Yakası",
      certification: "TS EN 81",
      status: "Müsait",
    },
  });

  const tech2 = await prisma.technician.create({
    data: {
      organizationId: org.id,
      name: "Ali Çelik",
      initials: "AÇ",
      phone: "0535 333 4444",
      zone: "Anadolu Yakası",
      certification: "TS EN 81",
      status: "Sahada",
    },
  });

  // Create demo assets
  const asset1 = await prisma.asset.create({
    data: {
      organizationId: org.id,
      customerId: customer1.id,
      name: "A Blok Asansörü",
      buildingName: "Güneş Sitesi A Blok",
      stops: 8,
      capacityKg: 630,
      controllerBrand: "Arkel",
      serialNumber: "SN-2018-0042",
      riskScore: 25,
      lastMaintenanceAt: new Date("2024-11-15"),
    },
  });

  const asset2 = await prisma.asset.create({
    data: {
      organizationId: org.id,
      customerId: customer1.id,
      name: "B Blok Asansörü",
      buildingName: "Güneş Sitesi B Blok",
      stops: 8,
      capacityKg: 630,
      controllerBrand: "Arkel",
      serialNumber: "SN-2018-0043",
      riskScore: 65,
      lastMaintenanceAt: new Date("2024-09-10"),
    },
  });

  const asset3 = await prisma.asset.create({
    data: {
      organizationId: org.id,
      customerId: customer2.id,
      name: "Servis Asansörü",
      buildingName: "Park Tower",
      stops: 12,
      capacityKg: 1000,
      controllerBrand: "Fermator",
      serialNumber: "SN-2020-0117",
      riskScore: 15,
    },
  });

  // Create demo work orders
  const wo1 = await prisma.workOrder.create({
    data: {
      organizationId: org.id,
      customerId: customer1.id,
      assetId: asset2.id,
      technicianId: tech1.id,
      code: "WO-25-00001",
      type: "FAULT",
      status: "URGENT",
      priority: "Kritik",
      note: "Kapı sensörü arızası — asansör çalışmıyor",
      laborCost: 35000,
      serviceFee: 15000,
    },
  });

  const wo2 = await prisma.workOrder.create({
    data: {
      organizationId: org.id,
      customerId: customer1.id,
      assetId: asset1.id,
      technicianId: tech2.id,
      code: "WO-25-00002",
      type: "PERIODIC_MAINTENANCE",
      status: "DONE",
      priority: "Normal",
      note: "Aylık periyodik bakım tamamlandı",
      laborCost: 28000,
      serviceFee: 12000,
      completedAt: new Date("2025-01-15"),
    },
  });

  const wo3 = await prisma.workOrder.create({
    data: {
      organizationId: org.id,
      customerId: customer2.id,
      assetId: asset3.id,
      code: "WO-25-00003",
      type: "ANNUAL_INSPECTION",
      status: "PENDING",
      priority: "Yüksek",
      note: "Yıllık Perpa muayenesi için planlama",
      scheduledAt: new Date("2025-02-28"),
    },
  });

  // Create demo parts
  const part1 = await prisma.part.create({
    data: {
      organizationId: org.id,
      name: "Kapı Sensörü",
      category: "Elektronik",
      unit: "Adet",
      supplier: "LiftParts TR",
      price: 45000,
      stock: 5,
      minStock: 2,
    },
  });

  await prisma.part.create({
    data: {
      organizationId: org.id,
      name: "Halat (6mm x 100m)",
      category: "Mekanik",
      unit: "Rulo",
      supplier: "MetalKablo",
      price: 180000,
      stock: 1,
      minStock: 1,
    },
  });

  await prisma.part.create({
    data: {
      organizationId: org.id,
      name: "Makine Yağı 5L",
      category: "Sarf Malzeme",
      unit: "Bidon",
      supplier: "Ototek",
      price: 8500,
      stock: 12,
      minStock: 4,
    },
  });

  // Add part usage to work order
  await prisma.partUsage.create({
    data: {
      workOrderId: wo1.id,
      partId: part1.id,
      quantity: 1,
    },
  });

  // Create a completed invoice
  await prisma.invoice.create({
    data: {
      organizationId: org.id,
      workOrderId: wo2.id,
      customerId: customer1.id,
      number: "INV-2025-0001",
      status: "PAID",
      subtotal: 40000,
      taxRate: 2000,
      taxAmount: 8000,
      total: 48000,
      paidAt: new Date("2025-01-20"),
      dueAt: new Date("2025-02-15"),
    },
  });

  // Maintenance plans
  await prisma.maintenancePlan.create({
    data: {
      organizationId: org.id,
      assetId: asset1.id,
      periodMonths: 1,
      lastDoneAt: new Date("2025-01-15"),
      nextDueAt: new Date("2025-02-15"),
    },
  });

  await prisma.maintenancePlan.create({
    data: {
      organizationId: org.id,
      assetId: asset2.id,
      periodMonths: 1,
      lastDoneAt: new Date("2024-09-10"),
      nextDueAt: new Date("2024-10-10"),
    },
  });

  console.log("✅ Seed tamamlandı!");
  console.log("\nDemo giriş bilgileri:");
  console.log("  Firma slug: demo");
  console.log("  E-posta: demo@servisim.app");
  console.log("  Şifre: demo1234");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
