import type { WorkflowNode, WorkflowEdge, NodeResult, AnyNodeData } from "@/types";

// ─── DAG Executor ─────────────────────────────────────────────────────────────

export interface ExecutionContext {
  nodeOutputs: Map<string, string>;
  nodeResults: NodeResult[];
}

// Build adjacency for topological sort
function buildGraph(nodes: WorkflowNode[], edges: WorkflowEdge[]) {
  const inDegree = new Map<string, number>();
  const dependents = new Map<string, string[]>(); // source -> targets
  const dependencies = new Map<string, string[]>(); // target -> sources

  for (const n of nodes) {
    inDegree.set(n.id, 0);
    dependents.set(n.id, []);
    dependencies.set(n.id, []);
  }

  for (const e of edges) {
    dependents.get(e.source)?.push(e.target);
    dependencies.get(e.target)?.push(e.source);
    inDegree.set(e.target, (inDegree.get(e.target) || 0) + 1);
  }

  return { inDegree, dependents, dependencies };
}

// Get topological execution waves (nodes that can run in parallel)
export function getExecutionWaves(
  nodes: WorkflowNode[],
  edges: WorkflowEdge[],
  targetIds?: string[]
): string[][] {
  const execNodes = targetIds
    ? nodes.filter((n) => targetIds.includes(n.id))
    : nodes;

  const execEdges = edges.filter(
    (e) =>
      execNodes.some((n) => n.id === e.source) &&
      execNodes.some((n) => n.id === e.target)
  );

  const { inDegree, dependents } = buildGraph(execNodes, execEdges);
  const waves: string[][] = [];
  const remaining = new Map(inDegree);

  while (remaining.size > 0) {
    const wave = [...remaining.entries()]
      .filter(([, deg]) => deg === 0)
      .map(([id]) => id);

    if (wave.length === 0) break; // cycle guard

    waves.push(wave);
    for (const nodeId of wave) {
      remaining.delete(nodeId);
      for (const dep of dependents.get(nodeId) || []) {
        remaining.set(dep, (remaining.get(dep) || 0) - 1);
      }
    }
  }

  return waves;
}

// Resolve inputs for a node based on connected outputs
export function resolveNodeInputs(
  nodeId: string,
  edges: WorkflowEdge[],
  context: ExecutionContext,
  nodes: WorkflowNode[]
): { texts: Record<string, string>; images: string[] } {
  const incoming = edges.filter((e) => e.target === nodeId);
  const texts: Record<string, string> = {};
  const images: string[] = [];

  for (const edge of incoming) {
    const output = context.nodeOutputs.get(edge.source);
    const sourceNode = nodes.find((n) => n.id === edge.source);
    if (!output || !sourceNode) continue;

    const targetHandle = edge.targetHandle || "";
    const sourceType = sourceNode.data.type;
if (targetHandle === "images") {
      images.push(output);
    } else if (targetHandle === "image_url") {
      texts.image_url = output;
    } else if (targetHandle === "video_url") {
      texts.video_url = output;
    } else if (targetHandle === "system_prompt") {
      texts.system_prompt = output;
    } else if (targetHandle === "user_message") {
      texts.user_message = output;
    } else if (targetHandle === "timestamp") {
      texts.timestamp = output;
    } else if (targetHandle === "x_percent") {
      texts.x_percent = output;
    } else if (targetHandle === "y_percent") {
      texts.y_percent = output;
    } else if (targetHandle === "width_percent") {
      texts.width_percent = output;
    } else if (targetHandle === "height_percent") {
      texts.height_percent = output;
    } else {
      // targetHandle is "output" or unset — fall back to sourceType
      if (
        sourceType === "upload_image" ||
        sourceType === "crop_image" ||
        sourceType === "extract_frame"
      ) {
        images.push(output);
      } else {
        texts[targetHandle || edge.source] = output;
      }
    }
  
  }

  return { texts, images };
}
