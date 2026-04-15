"use client";

import React, { useCallback, useRef, useEffect } from "react";
import ReactFlow, {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ReactFlowProvider,
  useReactFlow,
  Panel,
} from "reactflow";
import "reactflow/dist/style.css";

import { useWorkflowStore } from "@/store/workflow";
import { LeftSidebar } from "@/components/sidebar/LeftSidebar";
import { RightSidebar } from "@/components/sidebar/RightSidebar";
import { TopBar } from "@/components/canvas/TopBar";
import { TextNode } from "@/components/nodes/TextNode";
import { UploadImageNode } from "@/components/nodes/UploadImageNode";
import { UploadVideoNode } from "@/components/nodes/UploadVideoNode";
import { LLMNode } from "@/components/nodes/LLMNode";
import { CropImageNode } from "@/components/nodes/CropImageNode";
import { ExtractFrameNode } from "@/components/nodes/ExtractFrameNode";
import type { WorkflowNode } from "@/types";
import { nanoid } from "@/lib/utils";

// ─── MUST be outside component — prevents ReactFlow warning #002 ──────────────
const nodeTypes = {
  text: TextNode,
  upload_image: UploadImageNode,
  upload_video: UploadVideoNode,
  llm: LLMNode,
  crop_image: CropImageNode,
  extract_frame: ExtractFrameNode,
};

const defaultEdgeOptions = {
  style: { stroke: "#a855f7", strokeWidth: 2 },
  animated: false,
};

const nodeDefaults: Record<string, any> = {
  text:          { type: "text",          label: "Text",         text: "",                  status: "idle" },
  upload_image:  { type: "upload_image",  label: "Upload Image",                            status: "idle" },
  upload_video:  { type: "upload_video",  label: "Upload Video",                            status: "idle" },
  llm:           { type: "llm",           label: "Run LLM",      model: "gemini-1.5-flash", systemPrompt: "", userMessage: "", status: "idle" },
  crop_image:    { type: "crop_image",    label: "Crop Image",   xPercent: 0, yPercent: 0,  widthPercent: 100, heightPercent: 100, status: "idle" },
  extract_frame: { type: "extract_frame", label: "Extract Frame",timestamp: "0",            status: "idle" },
};

// ─────────────────────────────────────────────────────────────────────────────
function FlowCanvas() {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { screenToFlowPosition } = useReactFlow();
  const {
    nodes,
    edges,
    selectedNodeIds,
    onNodesChange,
    onEdgesChange,
    onConnect,
    addNode,
    deleteNode,
    setSelectedNodeIds,
  } = useWorkflowStore();

  const createNode = useCallback(
    (type: string, position = { x: 220 + Math.random() * 40, y: 160 + Math.random() * 40 }) => {
      const node: WorkflowNode = {
        id: nanoid(),
        type,
        position,
        data: { ...(nodeDefaults[type] ?? { type, label: type, status: "idle" }) },
      };
      addNode(node);
    },
    [addNode]
  );

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const nodeType = e.dataTransfer.getData("application/reactflow-type");
      if (!nodeType) return;
      const position = screenToFlowPosition({ x: e.clientX, y: e.clientY });
      createNode(nodeType, position);
    },
    [screenToFlowPosition, createNode]
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const tag = (document.activeElement as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (e.key === "Delete" || e.key === "Backspace") {
        nodes.filter((n) => n.selected).forEach((n) => deleteNode(n.id));
      }
    },
    [nodes, deleteNode]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // Sidebar click-to-add
  useEffect(() => {
    const handler = (e: Event) => {
      const { type } = (e as CustomEvent).detail ?? {};
      if (type) createNode(type);
    };
    window.addEventListener("add-node", handler);
    return () => window.removeEventListener("add-node", handler);
  }, [createNode]);

  return (
    <div ref={reactFlowWrapper} className="w-full h-full" onDragOver={onDragOver} onDrop={onDrop}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        defaultEdgeOptions={defaultEdgeOptions}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        deleteKeyCode={null}
        multiSelectionKeyCode="Shift"
        selectionKeyCode="Shift"
        onSelectionChange={({ nodes: sel }) => {
          const ids = sel.map((n) => n.id);
          // Prevent re-render loop — only update if actually changed
          if (ids.join(",") !== selectedNodeIds.join(",")) {
            setSelectedNodeIds(ids);
          }
        }}
        proOptions={{ hideAttribution: true }}
        className="bg-[#0d0d0d]"
      >
        <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="#252525" />
        <Controls
          position="bottom-left"
          className="!bottom-6 !left-[288px]"
          showInteractive={false}
        />
        <MiniMap
          position="bottom-right"
          className="!bottom-6 !right-[308px]"
          nodeColor="#2a2a2a"
          maskColor="rgba(0,0,0,0.65)"
          style={{ background: "#111", border: "1px solid #1e1e1e", borderRadius: 8 }}
        />

        {nodes.length === 0 && (
          <Panel position="top-center" className="mt-32">
            <div className="text-center animate-fade-in">
              <div className="text-[#333] text-sm mb-2">
                Drag nodes from the sidebar or click to add
              </div>
              <div className="flex gap-2 justify-center flex-wrap">
                {Object.keys(nodeDefaults).map((t) => (
                  <button
                    key={t}
                    onClick={() => createNode(t)}
                    className="px-3 py-1.5 text-xs bg-[#1a1a1a] border border-[#2a2a2a] rounded-md text-[#666] hover:text-[#e8e8e8] hover:border-[#3a3a3a] transition-all"
                  >
                    + {t.replace(/_/g, " ")}
                  </button>
                ))}
              </div>
            </div>
          </Panel>
        )}
      </ReactFlow>
    </div>
  );
}

// ─── WorkflowBuilder — fixes warning #004 with explicit height on container ───
export function WorkflowBuilder() {
  return (
    <ReactFlowProvider>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          height: "100vh",
          overflow: "hidden",
          background: "#0d0d0d",
        }}
      >
        <TopBar />
        <div style={{ display: "flex", flex: 1, overflow: "hidden", minHeight: 0 }}>
          <LeftSidebar />
          {/* minHeight:0 + minWidth:0 forces flex child to give ReactFlow real px height */}
          <main style={{ flex: 1, position: "relative", minHeight: 0, minWidth: 0 }}>
            <FlowCanvas />
          </main>
          <RightSidebar />
        </div>
      </div>
    </ReactFlowProvider>
  );
}