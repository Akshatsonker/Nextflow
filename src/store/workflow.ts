"use client";

import { create } from "zustand";
import {
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
  type Connection,
  type NodeChange,
  type EdgeChange,
} from "reactflow";
import type { WorkflowNode, WorkflowEdge, AnyNodeData, NodeStatus } from "@/types";
import { SOURCE_HANDLE_TYPES, TARGET_HANDLE_ACCEPTED } from "@/types";

interface WorkflowStore {
  workflowId: string | null;
  workflowName: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  selectedNodeIds: string[];
  isRunning: boolean;
  isSaving: boolean;
  setWorkflowId: (id: string) => void;
  setWorkflowName: (name: string) => void;
  setNodes: (nodes: WorkflowNode[]) => void;
  setEdges: (edges: WorkflowEdge[]) => void;
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => boolean;
  addNode: (node: WorkflowNode) => void;
  updateNodeData: (nodeId: string, data: Partial<AnyNodeData>) => void;
  updateNodeStatus: (nodeId: string, status: NodeStatus) => void;
  deleteNode: (nodeId: string) => void;
  setSelectedNodeIds: (ids: string[]) => void;
  setIsRunning: (v: boolean) => void;
  setIsSaving: (v: boolean) => void;
  resetNodeStatuses: () => void;
  loadWorkflow: (data: { id?: string; name: string; nodes: WorkflowNode[]; edges: WorkflowEdge[] }) => void;
}

export const useWorkflowStore = create<WorkflowStore>()((set, get) => ({
  workflowId: null,
  workflowName: "Untitled Workflow",
  nodes: [],
  edges: [],
  selectedNodeIds: [],
  isRunning: false,
  isSaving: false,

  setWorkflowId: (id) => set({ workflowId: id }),
  setWorkflowName: (name) => set({ workflowName: name }),
  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),

  onNodesChange: (changes) => {
    set((state) => {
      const nodes = applyNodeChanges(changes, state.nodes) as WorkflowNode[];
      const selectedNodeIds = nodes.filter((n) => n.selected).map((n) => n.id);
      return { nodes, selectedNodeIds };
    });
  },

  onEdgesChange: (changes) => {
    set((state) => ({
      edges: applyEdgeChanges(changes, state.edges) as WorkflowEdge[],
    }));
  },

  onConnect: (connection) => {
    const { nodes, edges } = get();
    const sourceNode = nodes.find((n) => n.id === connection.source);
    const targetHandle = connection.targetHandle;
    if (!sourceNode || !targetHandle) return false;
    const sourceType = SOURCE_HANDLE_TYPES[sourceNode.data.type];
    const accepted = TARGET_HANDLE_ACCEPTED[targetHandle] || [];
    if (!accepted.includes(sourceType)) return false;
    if (wouldCreateCycle(connection, nodes, edges)) return false;
    set((state) => ({
      edges: addEdge(
        { ...connection, animated: false, style: { stroke: "#a855f7", strokeWidth: 2 } },
        state.edges
      ) as WorkflowEdge[],
    }));
    return true;
  },

  addNode: (node) => set((state) => ({ nodes: [...state.nodes, node] })),

  updateNodeData: (nodeId, data) =>
    set((state) => ({
      nodes: state.nodes.map((n) =>
        n.id === nodeId ? { ...n, data: { ...n.data, ...data } } : n
      ),
    })),

  updateNodeStatus: (nodeId, status) =>
    set((state) => ({
      nodes: state.nodes.map((n) =>
        n.id === nodeId ? { ...n, data: { ...n.data, status } } : n
      ),
    })),

  deleteNode: (nodeId) =>
    set((state) => ({
      nodes: state.nodes.filter((n) => n.id !== nodeId),
      edges: state.edges.filter((e) => e.source !== nodeId && e.target !== nodeId),
    })),

  setSelectedNodeIds: (ids) => set({ selectedNodeIds: ids }),
  setIsRunning: (isRunning) => set({ isRunning }),
  setIsSaving: (isSaving) => set({ isSaving }),

  resetNodeStatuses: () =>
    set((state) => ({
      nodes: state.nodes.map((n) => ({
        ...n,
        data: { ...n.data, status: "idle" as NodeStatus },
      })),
    })),

  loadWorkflow: ({ id, name, nodes, edges }) =>
    set({ workflowId: id ?? null, workflowName: name, nodes, edges }),
}));

function wouldCreateCycle(connection: Connection, nodes: WorkflowNode[], edges: WorkflowEdge[]): boolean {
  if (!connection.source || !connection.target) return false;
  if (connection.source === connection.target) return true;
  const adj = new Map<string, string[]>();
  for (const edge of edges) {
    if (!adj.has(edge.source)) adj.set(edge.source, []);
    adj.get(edge.source)!.push(edge.target);
  }
  const visited = new Set<string>();
  const queue = [connection.target];
  while (queue.length > 0) {
    const curr = queue.shift()!;
    if (curr === connection.source) return true;
    if (visited.has(curr)) continue;
    visited.add(curr);
    queue.push(...(adj.get(curr) ?? []));
  }
  return false;
}
