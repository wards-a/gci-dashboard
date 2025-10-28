import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
const prisma = new PrismaClient();

async function main() {
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
