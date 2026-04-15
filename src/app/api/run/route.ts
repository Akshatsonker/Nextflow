import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { getExecutionWaves, resolveNodeInputs } from "@/lib/executor";
import type { WorkflowNode, WorkflowEdge, NodeResult, RunScope } from "@/types";
import { tasks } from "@trigger.dev/sdk";

export const maxDuration = 120;

const runSchema = z.object({
  workflowId: z.string(),
  scope: z.enum(["FULL", "PARTIAL", "SINGLE"]),
  selectedNodeIds: z.array(z.string()).optional(),
  nodes: z.array(z.any()),
  edges: z.array(z.any()),
});

export async function POST(req: NextRequest) {
  const { userId } = auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = runSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { workflowId, scope, selectedNodeIds, nodes, edges } = parsed.data;

  const run = await prisma.workflowRun.create({
    data: {
      workflowId,
      userId,
      status: "RUNNING",
      scope: scope as RunScope,
      nodeCount: nodes.length,
    },
  });

  const result = await executeWorkflow({
    runId: run.id,
    nodes: nodes as WorkflowNode[],
    edges: edges as WorkflowEdge[],
    scope: scope as RunScope,
    selectedNodeIds,
  });

  return NextResponse.json({
    runId: run.id,
    status: result.status,
    nodeResults: result.nodeResults,
    duration: result.duration,
  });
}

async function executeWorkflow({
  runId,
  nodes,
  edges,
  scope,
  selectedNodeIds,
}: {
  runId: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  scope: RunScope;
  selectedNodeIds?: string[];
}): Promise<{ status: string; nodeResults: NodeResult[]; duration: number }> {
  const startTime = Date.now();

  const context = {
    nodeOutputs: new Map<string, string>(),
    nodeResults: [] as NodeResult[],
  };

  let execNodes = nodes;

  if (scope === "SINGLE" && selectedNodeIds?.length === 1) {
    execNodes = nodes.filter((n) => selectedNodeIds.includes(n.id));
  } else if (scope === "PARTIAL" && selectedNodeIds?.length) {
    execNodes = nodes.filter((n) => selectedNodeIds.includes(n.id));
  }

  // Pre-fill instant nodes
  for (const node of nodes) {
    const d = node.data as any;

    if (d.type === "text" && d.text) {
      context.nodeOutputs.set(node.id, d.text);
    }

    if (d.type === "upload_image" && d.imageUrl) {
      context.nodeOutputs.set(node.id, d.imageUrl);
    }

    if (d.type === "upload_video" && d.videoUrl) {
      context.nodeOutputs.set(node.id, d.videoUrl);
    }
  }

  const waves = getExecutionWaves(execNodes, edges);
  let overallStatus: "SUCCESS" | "FAILED" | "PARTIAL" = "SUCCESS";

  for (const wave of waves) {
    const waveResults = await Promise.allSettled(
      wave.map((nodeId) => executeNode(nodeId, nodes, edges, context))
    );

    for (let i = 0; i < wave.length; i++) {
      const nodeId = wave[i];
      const node = nodes.find((n) => n.id === nodeId)!;
      const r = waveResults[i];

      if (r.status === "fulfilled") {
        context.nodeResults.push(r.value);
        if (r.value.status === "failed") overallStatus = "PARTIAL";
      } else {
        context.nodeResults.push({
          nodeId,
          nodeType: (node.data as any).type,
          nodeLabel: (node.data as any).label || nodeId,
          status: "failed",
          error: String(r.reason),
        });
        overallStatus = "PARTIAL";
      }
    }
  }

  const duration = Date.now() - startTime;

  await prisma.workflowRun.update({
    where: { id: runId },
    data: {
      status: overallStatus,
      duration,
      nodeResults: JSON.stringify(context.nodeResults),
      completedAt: new Date(),
    },
  });

  return { status: overallStatus, nodeResults: context.nodeResults, duration };
}

async function executeNode(
  nodeId: string,
  nodes: WorkflowNode[],
  edges: WorkflowEdge[],
  context: { nodeOutputs: Map<string, string>; nodeResults: NodeResult[] }
): Promise<NodeResult> {
  const node = nodes.find((n) => n.id === nodeId);
  if (!node) throw new Error(`Node ${nodeId} not found`);

  const t0 = Date.now();
  const data = node.data as any;
  const inputs = resolveNodeInputs(nodeId, edges, context, nodes);

  try {
    let output = "";

    if (data.type === "text") {
      output = data.text || "";

    } else if (data.type === "upload_image") {
      output = data.imageUrl || "";

    } else if (data.type === "upload_video") {
      output = data.videoUrl || "";

    } else if (data.type === "llm") {
      const userMsg = inputs.texts.user_message || data.userMessage || "";
      const sysMsg  = inputs.texts.system_prompt || data.systemPrompt || "";

      const result = await tasks.trigger("llm-node", {
        model: data.model || "gemini-1.5-flash",
        systemPrompt: sysMsg,
        userMessage: userMsg || sysMsg,
        imageUrls: inputs.images,
      });

      output = result.output;

    } else if (data.type === "crop_image") {
      const imageUrl = inputs.texts.image_url || data.imageUrl || "";

      const result = await tasks.trigger("crop-image", {
        imageUrl,
        xPercent: Number(inputs.texts.x_percent ?? data.xPercent ?? 0),
        yPercent: Number(inputs.texts.y_percent ?? data.yPercent ?? 0),
        widthPercent: Number(inputs.texts.width_percent ?? data.widthPercent ?? 100),
        heightPercent: Number(inputs.texts.height_percent ?? data.heightPercent ?? 100),
        transloaditKey: process.env.TRANSLOADIT_KEY!,
        transloaditSecret: process.env.TRANSLOADIT_SECRET!,
      });

      output = result.output;

    } else if (data.type === "extract_frame") {
      const videoUrl = inputs.texts.video_url || data.videoUrl || "";

      const result = await tasks.trigger("extract-frame", {
        videoUrl,
        timestamp: inputs.texts.timestamp || data.timestamp || "0",
        transloaditKey: process.env.TRANSLOADIT_KEY!,
        transloaditSecret: process.env.TRANSLOADIT_SECRET!,
      });

      output = result.output;
    }

    context.nodeOutputs.set(nodeId, output);

    return {
      nodeId,
      nodeType: data.type,
      nodeLabel: data.label || nodeId,
      status: "success",
      duration: Date.now() - t0,
      output,
    };

  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);

    return {
      nodeId,
      nodeType: data.type,
      nodeLabel: data.label || nodeId,
      status: "failed",
      duration: Date.now() - t0,
      error: errorMsg,
    };
  }
}