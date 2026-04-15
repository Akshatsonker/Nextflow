"use client";

import React from "react";
import { Handle, Position, type NodeProps, useEdges } from "reactflow";
import { Film } from "lucide-react";
import { NodeWrapper } from "./NodeWrapper";
import { useWorkflowStore } from "@/store/workflow";
import type { ExtractFrameNodeData } from "@/types";
import clsx from "clsx";

export function ExtractFrameNode({ id, data, selected }: NodeProps<ExtractFrameNodeData>) {
  const { updateNodeData } = useWorkflowStore();
  const edges = useEdges();
  const connectedTargets = edges.filter((e) => e.target === id).map((e) => e.targetHandle);
  const videoConnected = connectedTargets.includes("video_url");
  const timestampConnected = connectedTargets.includes("timestamp");

  const update = (field: string, value: any) =>
    updateNodeData(id, { [field]: value } as Partial<ExtractFrameNodeData>);

  return (
    <div className={selected ? "selected" : ""}>
      <NodeWrapper
        nodeId={id}
        status={data.status}
        label="Extract Frame"
        icon={<Film size={10} />}
        iconBg="bg-yellow-600"
        minWidth={240}
      >
        {/* Video URL */}
        <div className="mb-2.5">
          <label className={clsx(
            "text-[9px] uppercase tracking-wider mb-1 flex items-center gap-1",
            videoConnected ? "text-orange-400" : "text-[#444]"
          )}>
            <span className="w-1.5 h-1.5 rounded-full bg-current" />
            Video URL
            {videoConnected && <span className="text-[8px] normal-case tracking-normal ml-1 text-orange-400/60">(connected)</span>}
          </label>
          {!videoConnected && (
            <input
              type="url"
              value={data.videoUrl || ""}
              onChange={(e) => update("videoUrl", e.target.value)}
              placeholder="https://... or connect video node"
              className="nf-input text-[11px]"
            />
          )}
        </div>

        {/* Timestamp */}
        <div className="mb-2.5">
          <label className={clsx(
            "text-[9px] uppercase tracking-wider mb-1 flex items-center gap-1",
            timestampConnected ? "text-yellow-400" : "text-[#444]"
          )}>
            <span className="w-1.5 h-1.5 rounded-full bg-current" />
            Timestamp
            {timestampConnected && <span className="text-[8px] normal-case tracking-normal ml-1 text-yellow-400/60">(connected)</span>}
          </label>
          <input
            type="text"
            value={data.timestamp || ""}
            onChange={(e) => update("timestamp", e.target.value)}
            disabled={timestampConnected}
            placeholder="e.g. 30 (seconds) or 50% (percent)"
            className="nf-input text-[11px]"
          />
          <p className="text-[9px] text-[#333] mt-1">
            Seconds (e.g. &quot;30&quot;) or percentage (e.g. &quot;50%&quot;)
          </p>
        </div>

        {/* Output */}
        {data.output && (
          <div className="mt-2 border-t border-[#1a1a1a] pt-2">
            <div className="text-[9px] text-[#444] mb-1">Extracted Frame</div>
            <img
              src={data.output}
              alt="Extracted frame"
              className="w-full h-28 object-cover rounded border border-[#1a1a1a]"
            />
          </div>
        )}
      </NodeWrapper>

      {/* Input handles */}
      <Handle
        type="target"
        position={Position.Left}
        id="video_url"
        style={{ top: "35%", left: -5, background: "#ea580c", borderColor: "#f97316" }}
        title="video_url"
      />
      <Handle
        type="target"
        position={Position.Left}
        id="timestamp"
        style={{ top: "65%", left: -5, background: "#ca8a04", borderColor: "#eab308" }}
        title="timestamp"
      />

      <Handle
        type="source"
        position={Position.Right}
        id="output"
        style={{ top: "50%", right: -5 }}
      />
    </div>
  );
}
