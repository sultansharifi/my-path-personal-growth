import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.upsert({
    where: { email: "me@example.com" },
    update: {},
    create: {
      name: "کاربر مسیر من",
      email: "me@example.com",
      passwordHash: await bcrypt.hash("MyJourney123!", 12),
    },
  });
  const categories = [
    ["بهره‌وری", "#6d63d9", "timer"],
    ["تمرکز", "#3676d8", "focus"],
    ["سلامت", "#16967a", "heart"],
    ["روابط", "#dd5f69", "users"],
    ["ذهن‌آگاهی", "#4b85a8", "brain"],
  ];
  for (const [name, color, icon] of categories) {
    await prisma.category.upsert({ where: { name }, update: {}, create: { name, color, icon } });
  }
  console.log(`Personal account ready for ${user.email}; password stored as bcrypt hash.`);
}

main().finally(() => prisma.$disconnect());
