import { redirect } from "next/navigation";
import { ROLE_HOME } from "@/lib/routes";
import { requireUser } from "@/server/auth/guards";
import { getPrisma } from "@/server/db/prisma";

export default async function DashboardPage() {
  const user = await requireUser();
  if (user.role === "GESTAO") {
    const manager = await getPrisma().user.findUnique({
      where: { id: user.id },
      select: { institutionName: true },
    });
    if (!manager?.institutionName) redirect("/configurar-perfil");
  }
  redirect(ROLE_HOME[user.role]);
}
