"use client";

import React, { useState } from "react";
import {
  Type,
  Image,
  Video,
  Brain,
  Crop,
  Film,
  Search,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import clsx from "clsx";

interface NodeItem {
  type: string;
  label: string;
  icon: React.ReactNode;
  description: string;
  color: string;
  borderColor: string;
}

const NODE_TYPES: NodeItem[] = [
  {
    type: "text",
    label: "Text",
    icon: <Type size={14} />,
    description: "Text input / prompt",
    color: "bg-blue-600/10",
    borderColor: "border-blue-600/30",
  },
  {
    type: "upload_image",
    label: "Upload Image",
    icon: <Image size={14} />,
    description: "Upload jpg, png, webp, gif",
    color: "bg-green-600/10",
    borderColor: "border-green-600/30",
  },
  {
    type: "upload_video",
    label: "Upload Video",
    icon: <Video size={14} />,
    description: "Upload mp4, mov, webm",
    color: "bg-orange-600/10",
    borderColor: "border-orange-600/30",
  },
  {
    type: "llm",
    label: "Run LLM",
    icon: <Brain size={14} />,
    description: "Google Gemini AI model",
    color: "bg-purple-600/10",
    borderColor: "border-purple-600/30",
  },
  {
    type: "crop_image",
    label: "Crop Image",
    icon: <Crop size={14} />,
    description: "FFmpeg crop via Trigger.dev",
    color: "bg-pink-600/10",
    borderColor: "border-pink-600/30",
  },
  {
    type: "extract_frame",
    label: "Extract Frame",
    icon: <Film size={14} />,
    description: "Extract video frame",
    color: "bg-yellow-600/10",
    borderColor: "border-yellow-600/30",
  },
];

export function LeftSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = NODE_TYPES.filter(
    (n) =>
      n.label.toLowerCase().includes(search.toLowerCase()) ||
      n.description.toLowerCase().includes(search.toLowerCase())
  );

  const handleDragStart = (e: React.DragEvent, type: string) => {
    e.dataTransfer.setData("application/reactflow-type", type);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleClick = (type: string) => {
    // Dispatch a custom event to add node at center
    window.dispatchEvent(new CustomEvent("add-node", { detail: { type } }));
  };

  return (
    <aside
      className={clsx(
        "flex flex-col shrink-0 border-r border-[#1e1e1e] bg-[#0d0d0d] transition-all duration-200 relative z-10",
        collapsed ? "w-12" : "w-[220px]"
      )}
    >
      {/* Collapse button */}
      <button
        onClick={() => setCollapsed((v) => !v)}
        className="absolute -right-3 top-4 w-6 h-6 bg-[#161616] border border-[#2a2a2a] rounded-full flex items-center justify-center text-[#555] hover:text-[#e8e8e8] hover:border-[#3a3a3a] transition-all z-10"
      >
        {collapsed ? <ChevronRight size={10} /> : <ChevronLeft size={10} />}
      </button>

      {!collapsed && (
        <>
          {/* Header */}
          <div className="px-3 pt-4 pb-2">
            <div className="flex items-center gap-1.5 mb-3">
              <Sparkles size={12} className="text-purple-400" />
              <span className="text-[10px] font-semibold text-[#555] uppercase tracking-widest">
                Quick Access
              </span>
            </div>

            {/* Search */}
            <div className="relative">
              <Search size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#444]" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search nodes..."
                className="w-full bg-[#111] border border-[#1e1e1e] rounded-md pl-7 pr-2 py-1.5 text-xs text-[#888] placeholder-[#333] focus:outline-none focus:border-[#2a2a2a] focus:text-[#e8e8e8]"
              />
            </div>
          </div>

          {/* Node list */}
          <div className="flex-1 overflow-y-auto px-2 pb-4 space-y-1">
            {filtered.map((node) => (
              <div
                key={node.type}
                draggable
                onDragStart={(e) => handleDragStart(e, node.type)}
                onClick={() => handleClick(node.type)}
                className={clsx(
                  "flex items-center gap-2.5 px-2.5 py-2 rounded-lg border cursor-grab active:cursor-grabbing",
                  "hover:bg-[#161616] transition-all group select-none",
                  node.color,
                  node.borderColor
                )}
              >
                <span className="text-[#666] group-hover:text-[#e8e8e8] transition-colors shrink-0">
                  {node.icon}
                </span>
                <div className="min-w-0">
                  <div className="text-xs font-medium text-[#aaa] group-hover:text-[#e8e8e8] transition-colors truncate">
                    {node.label}
                  </div>
                  <div className="text-[10px] text-[#444] group-hover:text-[#666] truncate">
                    {node.description}
                  </div>
                </div>
              </div>
            ))}

            {filtered.length === 0 && (
              <div className="text-xs text-[#444] text-center py-4">
                No nodes found
              </div>
            )}
          </div>

          {/* Footer hint */}
          <div className="px-3 py-2 border-t border-[#1a1a1a]">
            <p className="text-[10px] text-[#333] text-center">
              Drag or click to add
            </p>
          </div>
        </>
      )}

      {/* Collapsed icon-only view */}
      {collapsed && (
        <div className="flex flex-col items-center gap-2 pt-4 px-1">
          {NODE_TYPES.map((node) => (
            <button
              key={node.type}
              title={node.label}
              draggable
              onDragStart={(e) => handleDragStart(e, node.type)}
              onClick={() => handleClick(node.type)}
              className="w-8 h-8 rounded-lg bg-[#111] border border-[#1e1e1e] flex items-center justify-center text-[#555] hover:text-[#e8e8e8] hover:border-[#2a2a2a] transition-all"
            >
              {node.icon}
            </button>
          ))}
        </div>
      )}
    </aside>
  );
}
