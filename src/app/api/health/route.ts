import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const activeGames = await prisma.gameSession.count({
    where: { status: "playing" },
  });

  const totalUsers = await prisma.user.count();

  return NextResponse.json({
    activeGames,
    totalUsers,
    status: "ok",
  });
}
