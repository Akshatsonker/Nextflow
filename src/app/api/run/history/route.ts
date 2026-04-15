import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { userId } = auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const workflowId = url.searchParams.get("workflowId");

  const runs = await prisma.workflowRun.findMany({
    where: { userId, ...(workflowId ? { workflowId } : {}) },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json(
    runs.map((r) => ({
      id: r.id,
      workflowId: r.workflowId,
      status: r.status,
      scope: r.scope,
      nodeCount: r.nodeCount,
      duration: r.duration,
      nodeResults:
        typeof r.nodeResults === "string"
          ? JSON.parse(r.nodeResults)
          : r.nodeResults,
      createdAt: r.createdAt.toISOString(),
      completedAt: r.completedAt?.toISOString(),
    }))
  );
}
