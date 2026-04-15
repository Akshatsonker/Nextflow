import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: { runId: string } }
) {
  const { userId } = auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const run = await prisma.workflowRun.findFirst({
    where: { id: params.runId, userId },
  });

  if (!run) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    id: run.id,
    status: run.status,
    scope: run.scope,
    duration: run.duration,
    nodeResults:
      typeof run.nodeResults === "string"
        ? JSON.parse(run.nodeResults)
        : run.nodeResults,
    createdAt: run.createdAt.toISOString(),
    completedAt: run.completedAt?.toISOString(),
  });
}
