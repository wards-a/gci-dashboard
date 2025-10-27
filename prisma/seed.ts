import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
const prisma = new PrismaClient();

async function main() {
  // Work Centers
  const [wcCut, wcBrd, wcSew, wcFin] = await Promise.all([
    prisma.workCenter.upsert({
      where: { code: "CUT-01" },
      update: {},
      create: { code: "CUT-01", name: "Cutting" },
    }),
    prisma.workCenter.upsert({
      where: { code: "BRD-01" },
      update: {},
      create: { code: "BRD-01", name: "Branding" },
    }),
    prisma.workCenter.upsert({
      where: { code: "SEW-01" },
      update: {},
      create: { code: "SEW-01", name: "Sewing" },
    }),
    prisma.workCenter.upsert({
      where: { code: "FIN-01" },
      update: {},
      create: { code: "FIN-01", name: "Finishing" },
    }),
  ]);

  // Operations
  const [opCut, opBrd, opSew, opFin] = await Promise.all([
    (async () => {
      let op = await prisma.operation.findFirst({ where: { name: "Cutting" } });
      if (!op) {
        op = await prisma.operation.create({
          data: { name: "Cutting", workCenterId: wcCut.id, stdTimeMin: 2 },
        });
      }
      return op;
    })(),
    (async () => {
      let op = await prisma.operation.findFirst({
        where: { name: "Branding" },
      });
      if (!op) {
        op = await prisma.operation.create({
          data: { name: "Branding", workCenterId: wcBrd.id, stdTimeMin: 1 },
        });
      }
      return op;
    })(),
    (async () => {
      let op = await prisma.operation.findFirst({ where: { name: "Sewing" } });
      if (!op) {
        op = await prisma.operation.create({
          data: { name: "Sewing", workCenterId: wcSew.id, stdTimeMin: 5 },
        });
      }
      return op;
    })(),
    (async () => {
      let op = await prisma.operation.findFirst({
        where: { name: "Finishing" },
      });
      if (!op) {
        op = await prisma.operation.create({
          data: { name: "Finishing", workCenterId: wcFin.id, stdTimeMin: 3 },
        });
      }
      return op;
    })(),
  ]);

  // User admin
  await prisma.user.upsert({
    where: { email: "admin@gci.local" },
    update: {},
    create: {
      email: "admin@gci.local",
      password: "hash:dev",
      role: "ADMIN",
      name: "Admin",
    },
  });

  // Product/Variant (minimal)
  const product = await prisma.product.upsert({
    where: { code: "BAG-001" },
    update: {},
    create: { code: "BAG-001", name: "Backpack Alpha" },
  });
  const variant = await prisma.productVariant.upsert({
    where: { uniqueCode: "BAG-001-BLACK" },
    update: {},
    create: {
      productId: product.id,
      color: "Black",
      size: "Std",
      uniqueCode: "BAG-001-BLACK",
    },
  });

  // Work Order + routing Cut→Branding→Sew→Finish
  const wo = await prisma.workOrder.create({
    data: {
      code: "WO-DEMO-001",
      productVarId: variant.id,
      qtyPlanned: 100,
      createdBy: "seed",
    },
  });

  await prisma.woOperation.createMany({
    data: [
      { woId: wo.id, operationId: opCut.id, seq: 1 },
      { woId: wo.id, operationId: opBrd.id, seq: 2 },
      { woId: wo.id, operationId: opSew.id, seq: 3 },
      { woId: wo.id, operationId: opFin.id, seq: 4 },
    ],
  });
}

const email = "admin@example.com";
const plain = "admin123";
const password = await bcrypt.hash(plain, 10);

await prisma.user.upsert({
  where: { email },
  update: { password, role: "ADMIN" },
  create: { email, password, role: "ADMIN", name: "Admin" },
});
console.log("Seeded admin:", email, "/", plain);

const customer = await prisma.customer.upsert({
  where: { email: "buyer@example.com" },
  update: { name: "Buyer Demo" },
  create: { email: "buyer@example.com", name: "Buyer Demo", phone: "0812xxxx" },
});

const product = await prisma.product.upsert({
  where: { code: "BAG-001" },
  update: {},
  create: { code: "BAG-001", name: "Backpack Alpha" },
});
const variant = await prisma.productVariant.upsert({
  where: { uniqueCode: "BAG-001-BLACK" },
  update: {},
  create: {
    productId: product.id,
    color: "Black",
    size: "Std",
    uniqueCode: "BAG-001-BLACK",
  },
});

const po = await prisma.preOrder.create({
  data: {
    code: "PO-DEM-001",
    customerId: customer.id,
    status: "CONFIRMED",
    promisedShip: new Date(Date.now() + 5 * 86400000),
    createdBy: "seed",
    items: {
      create: [{ title: "", qtyOrdered: 120, unitPrice: 350000 }],
    },
    payments: {
      create: [{ amount: 10000000, method: "transfer", note: "DP" }],
    },
  },
});

console.log("Seeded PreOrder:", po.code);

console.log("Seed done.");
main().finally(() => prisma.$disconnect());
