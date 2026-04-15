"use client";

import React from "react";
import { Handle, Position, type NodeProps, useEdges } from "reactflow";
import { Brain, ChevronDown } from "lucide-react";
import { NodeWrapper } from "./NodeWrapper";
import { useWorkflowStore } from "@/store/workflow";
import type { LLMNodeData } from "@/types";
import { GEMINI_MODELS } from "@/types";
import clsx from "clsx";

export function LLMNode({ id, data, selected }: NodeProps<LLMNodeData>) {
  const { updateNodeData } = useWorkflowStore();
  const edges = useEdges();

  // Check which handles are connected
  const connectedTargets = edges
    .filter((e) => e.target === id)
    .map((e) => e.targetHandle);

  const systemConnected = connectedTargets.includes("system_prompt");
  const messageConnected = connectedTargets.includes("user_message");
  const imagesConnected = connectedTargets.includes("images");

  return (
    <div className={selected ? "selected" : ""} style={{ minWidth: 260 }}>
      <NodeWrapper
        nodeId={id}
        status={data.status}
        label="Run LLM"
        icon={<Brain size={10} />}
        iconBg="bg-purple-600"
        minWidth={260}
      >
        {/* Model selector */}
        <div className="mb-2.5">
          <label className="text-[9px] text-[#444] uppercase tracking-wider mb-1 block">Model</label>
          <div className="relative">
            <select
              value={data.model}
              onChange={(e) => updateNodeData(id, { model: e.target.value } as Partial<LLMNodeData>)}
              className="nf-input appearance-none pr-6 text-[11px]"
            >
              {GEMINI_MODELS.map((m) => (
                <option key={m.id} value={m.id}>{m.label}</option>
              ))}
            </select>
            <ChevronDown size={10} className="absolute right-2 top-1/2 -translate-y-1/2 text-[#555] pointer-events-none" />
          </div>
        </div>

        {/* System prompt */}
        <div className="mb-2">
          <label className={clsx(
            "text-[9px] uppercase tracking-wider mb-1 flex items-center gap-1",
            systemConnected ? "text-purple-400" : "text-[#444]"
          )}>
            <span className="w-1.5 h-1.5 rounded-full bg-current" />
            System Prompt
            {systemConnected && <span className="text-[8px] text-purple-400/60 normal-case tracking-normal">(connected)</span>}
          </label>
          <textarea
            value={data.systemPrompt || ""}
            onChange={(e) => updateNodeData(id, { systemPrompt: e.target.value } as Partial<LLMNodeData>)}
            disabled={systemConnected}
            placeholder={systemConnected ? "Value from connected node" : "Optional system instructions..."}
            rows={2}
            className="nf-input text-[11px] leading-relaxed resize-none"
          />
        </div>

        {/* User message */}
        <div className="mb-2">
          <label className={clsx(
            "text-[9px] uppercase tracking-wider mb-1 flex items-center gap-1",
            messageConnected ? "text-blue-400" : "text-[#444]"
          )}>
            <span className="w-1.5 h-1.5 rounded-full bg-current" />
            User Message *
            {messageConnected && <span className="text-[8px] text-blue-400/60 normal-case tracking-normal">(connected)</span>}
          </label>
          <textarea
            value={data.userMessage || ""}
            onChange={(e) => updateNodeData(id, { userMessage: e.target.value } as Partial<LLMNodeData>)}
            disabled={messageConnected}
            placeholder={messageConnected ? "Value from connected node" : "Enter your prompt..."}
            rows={3}
            className="nf-input text-[11px] leading-relaxed resize-none"
          />
        </div>

        {/* Images indicator */}
        {imagesConnected && (
          <div className="flex items-center gap-1.5 text-[9px] text-green-400 mb-2 bg-green-400/5 border border-green-400/15 rounded px-2 py-1">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
            Images connected (vision enabled)
          </div>
        )}

        {/* Output display */}
        {data.output && (
          <div className="mt-2 border-t border-[#1a1a1a] pt-2">
            <div className="text-[9px] text-[#444] uppercase tracking-wider mb-1.5">Output</div>
            <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded p-2 text-[11px] text-[#aaa] leading-relaxed max-h-36 overflow-y-auto font-mono whitespace-pre-wrap">
              {data.output}
            </div>
          </div>
        )}
      </NodeWrapper>

      {/* Input handles */}
      <Handle
        type="target"
        position={Position.Left}
        id="system_prompt"
        style={{ top: "30%", left: -5, background: "#7c3aed", borderColor: "#a855f7" }}
        title="system_prompt"
      />
      <Handle
        type="target"
        position={Position.Left}
        id="user_message"
        style={{ top: "55%", left: -5, background: "#2563eb", borderColor: "#3b82f6" }}
        title="user_message"
      />
      <Handle
        type="target"
        position={Position.Left}
        id="images"
        style={{ top: "80%", left: -5, background: "#16a34a", borderColor: "#22c55e" }}
        title="images"
      />

      {/* Output handle */}
      <Handle
        type="source"
        position={Position.Right}
        id="output"
        style={{ top: "50%", right: -5 }}
      />
    </div>
  );
}
