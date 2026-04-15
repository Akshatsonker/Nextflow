import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const saveSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1).max(100),
  nodes: z.array(z.any()),
  edges: z.array(z.any()),
});

export async function POST(req: NextRequest) {
  const { userId } = auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = saveSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { id, name, nodes, edges } = parsed.data;

  let workflow;
  if (id) {
    // Update existing - verify ownership
    const existing = await prisma.workflow.findFirst({ where: { id, userId } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    workflow = await prisma.workflow.update({
      where: { id },
      data: { name, nodes: JSON.stringify(nodes), edges: JSON.stringify(edges) },
    });
  } else {
    workflow = await prisma.workflow.create({
      data: {
        userId,
        name,
        nodes: JSON.stringify(nodes),
        edges: JSON.stringify(edges),
      },
    });
  }

  return NextResponse.json({ id: workflow.id, name: workflow.name });
}

export async function GET(req: NextRequest) {
  const { userId } = auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const id = url.searchParams.get("id");

  if (id) {
    const workflow = await prisma.workflow.findFirst({ where: { id, userId } });
    if (!workflow) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json({
      id: workflow.id,
      name: workflow.name,
      nodes: typeof workflow.nodes === "string" ? JSON.parse(workflow.nodes) : workflow.nodes,
      edges: typeof workflow.edges === "string" ? JSON.parse(workflow.edges) : workflow.edges,
    });
  }

  // List all workflows
  const workflows = await prisma.workflow.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    select: { id: true, name: true, updatedAt: true },
  });

  return NextResponse.json(workflows);
}
