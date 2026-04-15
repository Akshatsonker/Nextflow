"use client";

import React from "react";
import { X, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { useWorkflowStore } from "@/store/workflow";
import type { NodeStatus } from "@/types";
import clsx from "clsx";

interface NodeWrapperProps {
  nodeId: string;
  status?: NodeStatus;
  label: string;
  icon: React.ReactNode;
  iconBg?: string;
  children: React.ReactNode;
  minWidth?: number;
}

export function NodeWrapper({
  nodeId,
  status = "idle",
  label,
  icon,
  iconBg = "bg-purple-600",
  children,
  minWidth = 240,
}: NodeWrapperProps) {
  const { deleteNode } = useWorkflowStore();

  return (
    <div
      className={clsx(
        "workflow-node",
        status === "running" && "node-running border-purple-600/60",
        status === "success" && "border-green-600/40",
        status === "error" && "border-red-600/40"
      )}
      style={{ minWidth }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-[#222]">
        <div className="flex items-center gap-2">
          <div
            className={clsx(
              "w-5 h-5 rounded flex items-center justify-center text-white shrink-0",
              iconBg
            )}
          >
            {icon}
          </div>
          <span className="text-[11px] font-semibold text-[#aaa] uppercase tracking-wider">
            {label}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Status indicator */}
          {status === "running" && (
            <Loader2 size={11} className="text-purple-400 animate-spin" />
          )}
          {status === "success" && (
            <CheckCircle2 size={11} className="text-green-400" />
          )}
          {status === "error" && (
            <XCircle size={11} className="text-red-400" />
          )}

          {/* Delete button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              deleteNode(nodeId);
            }}
            className="w-5 h-5 rounded flex items-center justify-center text-[#444] hover:text-red-400 hover:bg-red-400/10 transition-all"
          >
            <X size={11} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-3">{children}</div>
    </div>
  );
}
