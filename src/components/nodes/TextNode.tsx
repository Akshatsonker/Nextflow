"use client";

import React from "react";
import { Handle, Position, type NodeProps } from "reactflow";
import { Type } from "lucide-react";
import { NodeWrapper } from "./NodeWrapper";
import { useWorkflowStore } from "@/store/workflow";
import type { TextNodeData } from "@/types";

export function TextNode({ id, data, selected }: NodeProps<TextNodeData>) {
  const { updateNodeData } = useWorkflowStore();

  return (
    <div className={selected ? "selected" : ""}>
      <NodeWrapper
        nodeId={id}
        status={data.status}
        label="Text"
        icon={<Type size={10} />}
        iconBg="bg-blue-600"
      >
        <textarea
          value={data.text}
          onChange={(e) =>
            updateNodeData(id, { text: e.target.value } as Partial<TextNodeData>)
          }
          placeholder="Enter text or prompt..."
          rows={4}
          className="nf-input text-xs leading-relaxed resize-none"
        />
        {data.output && (
          <div className="mt-2 p-2 bg-[#0a0a0a] border border-[#1a1a1a] rounded text-[10px] text-[#555] font-mono leading-relaxed max-h-20 overflow-y-auto">
            {data.output}
          </div>
        )}
      </NodeWrapper>

      {/* Output handle */}
      <Handle
        type="source"
        position={Position.Right}
        id="output"
        className="!right-[-5px]"
        style={{ top: "50%" }}
      />
    </div>
  );
}
