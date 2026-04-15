import type { Node, Edge } from "reactflow";

// ─── Node Data Types ──────────────────────────────────────────────────────────

export interface TextNodeData {
  type: "text";
  label: string;
  text: string;
  output?: string;
  status?: NodeStatus;
}

export interface UploadImageNodeData {
  type: "upload_image";
  label: string;
  imageUrl?: string;
  fileName?: string;
  output?: string;
  status?: NodeStatus;
}

export interface UploadVideoNodeData {
  type: "upload_video";
  label: string;
  videoUrl?: string;
  fileName?: string;
  output?: string;
  status?: NodeStatus;
}

export interface LLMNodeData {
  type: "llm";
  label: string;
  model: string;
  systemPrompt?: string;
  userMessage?: string;
  images?: string[];
  output?: string;
  status?: NodeStatus;
  triggerJobId?: string;
}

export interface CropImageNodeData {
  type: "crop_image";
  label: string;
  imageUrl?: string;
  xPercent?: number;
  yPercent?: number;
  widthPercent?: number;
  heightPercent?: number;
  output?: string;
  status?: NodeStatus;
  triggerJobId?: string;
}

export interface ExtractFrameNodeData {
  type: "extract_frame";
  label: string;
  videoUrl?: string;
  timestamp?: string;
  output?: string;
  status?: NodeStatus;
  triggerJobId?: string;
}

export type AnyNodeData =
  | TextNodeData
  | UploadImageNodeData
  | UploadVideoNodeData
  | LLMNodeData
  | CropImageNodeData
  | ExtractFrameNodeData;

export type NodeStatus = "idle" | "running" | "success" | "error";

// ─── Workflow Types ───────────────────────────────────────────────────────────

export type WorkflowNode = Node<AnyNodeData>;
export type WorkflowEdge = Edge;

export interface WorkflowState {
  id?: string;
  name: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
}

// ─── History Types ────────────────────────────────────────────────────────────

export type RunStatus = "RUNNING" | "SUCCESS" | "FAILED" | "PARTIAL";
export type RunScope = "FULL" | "PARTIAL" | "SINGLE";

export interface NodeResult {
  nodeId: string;
  nodeType: string;
  nodeLabel: string;
  status: "success" | "failed" | "skipped";
  duration?: number;
  output?: string;
  error?: string;
}

export interface WorkflowRun {
  id: string;
  workflowId: string;
  userId: string;
  status: RunStatus;
  scope: RunScope;
  nodeCount: number;
  duration?: number;
  nodeResults: NodeResult[];
  createdAt: string;
  completedAt?: string;
}

// ─── API Types ────────────────────────────────────────────────────────────────

export interface RunWorkflowRequest {
  workflowId: string;
  scope: RunScope;
  selectedNodeIds?: string[];
}

export interface RunWorkflowResponse {
  runId: string;
  status: RunStatus;
}

// ─── Gemini Models ────────────────────────────────────────────────────────────

export const GEMINI_MODELS = [
  { id: "gemini-1.5-flash", label: "Gemini 1.5 Flash (fast)" },
  { id: "gemini-1.5-pro", label: "Gemini 1.5 Pro (smart)" },
  { id: "gemini-2.0-flash-exp", label: "Gemini 2.0 Flash (latest)" },
] as const;

export type GeminiModelId = (typeof GEMINI_MODELS)[number]["id"];

// ─── Edge Types ───────────────────────────────────────────────────────────────

// Valid connection rules per handle type
export const HANDLE_TYPES = {
  text: ["system_prompt", "user_message", "timestamp"],
  image: ["images", "image_url"],
  video: ["video_url"],
  any: ["system_prompt", "user_message", "images", "image_url", "video_url", "timestamp"],
} as const;

export const SOURCE_HANDLE_TYPES: Record<string, string> = {
  text: "text",
  upload_image: "image",
  upload_video: "video",
  llm: "text",
  crop_image: "image",
  extract_frame: "image",
};

export const TARGET_HANDLE_ACCEPTED: Record<string, string[]> = {
  system_prompt: ["text"],
  user_message: ["text"],
  images: ["image"],
  image_url: ["image"],
  video_url: ["video"],
  timestamp: ["text"],
};
