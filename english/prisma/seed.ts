import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.upsert({
    where: { email: "me@example.com" },
    update: {},
    create: {
      name: "My Path User",
      email: "me@example.com",
      passwordHash: await bcrypt.hash("MyJourney123!", 12),
    },
  });
  const categories = [
    ["Productivity", "#6d63d9", "timer"],
    ["Focus", "#3676d8", "focus"],
    ["Health", "#16967a", "heart"],
    ["Relationships", "#dd5f69", "users"],
    ["Mindfulness", "#4b85a8", "brain"],
  ];
  for (const [name, color, icon] of categories) {
    await prisma.category.upsert({ where: { name }, update: {}, create: { name, color, icon } });
  }
  console.log(`Personal account ready for ${user.email}; password stored as bcrypt hash.`);
}

main().finally(() => prisma.$disconnect());
