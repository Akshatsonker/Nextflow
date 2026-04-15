"use client";

import React from "react";
import { Handle, Position, type NodeProps, useEdges } from "reactflow";
import { Crop } from "lucide-react";
import { NodeWrapper } from "./NodeWrapper";
import { useWorkflowStore } from "@/store/workflow";
import type { CropImageNodeData } from "@/types";
import clsx from "clsx";

function SliderField({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <label className="text-[9px] text-[#444] w-16 shrink-0">{label}</label>
      <input
        type="range"
        min={0}
        max={100}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
        className="flex-1 h-1 accent-pink-500 disabled:opacity-40"
      />
      <span className="text-[9px] text-[#555] w-8 text-right">{value}%</span>
    </div>
  );
}

export function CropImageNode({ id, data, selected }: NodeProps<CropImageNodeData>) {
  const { updateNodeData } = useWorkflowStore();
  const edges = useEdges();
  const connectedTargets = edges.filter((e) => e.target === id).map((e) => e.targetHandle);
  const imageConnected = connectedTargets.includes("image_url");

  const update = (field: string, value: any) =>
    updateNodeData(id, { [field]: value } as Partial<CropImageNodeData>);

  return (
    <div className={selected ? "selected" : ""}>
      <NodeWrapper
        nodeId={id}
        status={data.status}
        label="Crop Image"
        icon={<Crop size={10} />}
        iconBg="bg-pink-600"
        minWidth={250}
      >
        {/* Image URL indicator */}
        <div className="mb-3">
          <label className={clsx(
            "text-[9px] uppercase tracking-wider mb-1 flex items-center gap-1",
            imageConnected ? "text-green-400" : "text-[#444]"
          )}>
            <span className="w-1.5 h-1.5 rounded-full bg-current" />
            Image URL
            {imageConnected && <span className="text-[8px] normal-case tracking-normal ml-1 text-green-400/60">(connected)</span>}
          </label>
          {!imageConnected && (
            <input
              type="url"
              value={data.imageUrl || ""}
              onChange={(e) => update("imageUrl", e.target.value)}
              placeholder="https://... or connect image node"
              className="nf-input text-[11px]"
            />
          )}
        </div>

        {/* Crop parameters */}
        <div className="space-y-2">
          <div className="text-[9px] text-[#444] uppercase tracking-wider mb-1">Crop Region</div>
          <SliderField label="X offset" value={data.xPercent ?? 0} onChange={(v) => update("xPercent", v)} />
          <SliderField label="Y offset" value={data.yPercent ?? 0} onChange={(v) => update("yPercent", v)} />
          <SliderField label="Width" value={data.widthPercent ?? 100} onChange={(v) => update("widthPercent", v)} />
          <SliderField label="Height" value={data.heightPercent ?? 100} onChange={(v) => update("heightPercent", v)} />
        </div>

        {/* Preview crop region visualization */}
        <div className="mt-3 relative w-full h-16 bg-[#0a0a0a] border border-[#1a1a1a] rounded overflow-hidden">
          <div
            className="absolute border-2 border-pink-500 bg-pink-500/10"
            style={{
              left: `${data.xPercent ?? 0}%`,
              top: `${data.yPercent ?? 0}%`,
              width: `${data.widthPercent ?? 100}%`,
              height: `${data.heightPercent ?? 100}%`,
            }}
          />
          <span className="absolute bottom-1 right-1 text-[8px] text-[#333]">preview</span>
        </div>

        {/* Output */}
        {data.output && (
          <div className="mt-2 border-t border-[#1a1a1a] pt-2">
            <img
              src={data.output}
              alt="Cropped"
              className="w-full h-24 object-cover rounded border border-[#1a1a1a]"
            />
          </div>
        )}
      </NodeWrapper>

      {/* Input handles */}
      <Handle
        type="target"
        position={Position.Left}
        id="image_url"
        style={{ top: "30%", left: -5, background: "#16a34a", borderColor: "#22c55e" }}
        title="image_url"
      />
      <Handle
        type="target"
        position={Position.Left}
        id="x_percent"
        style={{ top: "50%", left: -5, background: "#db2777", borderColor: "#ec4899" }}
        title="x_percent"
      />
      <Handle
        type="target"
        position={Position.Left}
        id="y_percent"
        style={{ top: "60%", left: -5, background: "#db2777", borderColor: "#ec4899" }}
        title="y_percent"
      />
      <Handle
        type="target"
        position={Position.Left}
        id="width_percent"
        style={{ top: "70%", left: -5, background: "#db2777", borderColor: "#ec4899" }}
        title="width_percent"
      />
      <Handle
        type="target"
        position={Position.Left}
        id="height_percent"
        style={{ top: "80%", left: -5, background: "#db2777", borderColor: "#ec4899" }}
        title="height_percent"
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
