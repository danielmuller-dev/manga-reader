import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

function mustEnv(name: string): string | null {
  const v = process.env[name];
  if (!v || !v.trim()) return null;
  return v.trim();
}

async function main() {
  const email = mustEnv("ADMIN_EMAIL");
  const password = mustEnv("ADMIN_PASSWORD");
  const name = mustEnv("ADMIN_NAME"); // opcional

  if (!email || !password) {
    console.log(
      "Seed: ADMIN_EMAIL ou ADMIN_PASSWORD não definidos. Nenhuma ação foi executada."
    );
    return;
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, role: true },
  });

  // Sempre garantimos que o ADMIN tenha role ADMIN.
  // A senha: por padrão NÃO vamos sobrescrever se o usuário já existe.
  // Se quiser sobrescrever, use ADMIN_FORCE_PASSWORD=true.
  const forcePassword = (mustEnv("ADMIN_FORCE_PASSWORD") || "").toLowerCase() === "true";

  if (user) {
    if (user.role !== "ADMIN") {
      await prisma.user.update({
        where: { id: user.id },
        data: { role: "ADMIN" },
      });
      console.log(`Seed: usuário existente promovido para ADMIN (${email}).`);
    } else {
      console.log(`Seed: admin já existe (${email}).`);
    }

    if (forcePassword) {
      const hash = await bcrypt.hash(password, 10);
      await prisma.user.update({
        where: { id: user.id },
        data: { passwordHash: hash },
      });
      console.log("Seed: senha do admin foi atualizada (ADMIN_FORCE_PASSWORD=true).");
    }

    // Atualiza nome opcionalmente se vier ADMIN_NAME e o usuário existir
    if (name) {
      await prisma.user.update({
        where: { id: user.id },
        data: { name },
      });
      console.log("Seed: nome do admin atualizado (ADMIN_NAME definido).");
    }

    return;
  }

  const hash = await bcrypt.hash(password, 10);

  await prisma.user.create({
    data: {
      email,
      passwordHash: hash,
      role: "ADMIN",
      name: name || null,
    },
    select: { id: true },
  });

  console.log(`Seed: admin criado com sucesso (${email}).`);
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });