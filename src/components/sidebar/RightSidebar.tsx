"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  History,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  RefreshCw,
  ChevronLeft,
} from "lucide-react";
import { useWorkflowStore } from "@/store/workflow";
import type { WorkflowRun, NodeResult } from "@/types";
import { formatDistanceToNow, format } from "date-fns";
import clsx from "clsx";

export function RightSidebar() {
  const { workflowId } = useWorkflowStore();
  const [runs, setRuns] = useState<WorkflowRun[]>([]);
  const [expandedRunId, setExpandedRunId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const fetchHistory = useCallback(async () => {
    if (!workflowId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/run/history?workflowId=${workflowId}`);
      const data = await res.json();
      setRuns(data);
    } catch {
      console.error("Failed to fetch history");
    } finally {
      setLoading(false);
    }
  }, [workflowId]);

  useEffect(() => {
    fetchHistory();
    const interval = setInterval(fetchHistory, 5000);
    return () => clearInterval(interval);
  }, [fetchHistory]);

  const statusIcon = (status: string) => {
    switch (status) {
      case "SUCCESS": return <CheckCircle2 size={12} className="text-green-400 shrink-0" />;
      case "FAILED": return <XCircle size={12} className="text-red-400 shrink-0" />;
      case "PARTIAL": return <AlertTriangle size={12} className="text-yellow-400 shrink-0" />;
      case "RUNNING": return <Clock size={12} className="text-blue-400 shrink-0 animate-pulse" />;
      default: return <Clock size={12} className="text-[#555] shrink-0" />;
    }
  };

  const statusBadge = (status: string) => (
    <span
      className={clsx(
        "text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded",
        status === "SUCCESS" && "bg-green-600/15 text-green-400",
        status === "FAILED" && "bg-red-600/15 text-red-400",
        status === "PARTIAL" && "bg-yellow-600/15 text-yellow-400",
        status === "RUNNING" && "bg-blue-600/15 text-blue-400"
      )}
    >
      {status}
    </span>
  );

  const nodeStatusIcon = (status: string) => {
    switch (status) {
      case "success": return <CheckCircle2 size={10} className="text-green-400 shrink-0" />;
      case "failed": return <XCircle size={10} className="text-red-400 shrink-0" />;
      case "skipped": return <Clock size={10} className="text-[#555] shrink-0" />;
      default: return null;
    }
  };

  if (collapsed) {
    return (
      <aside className="w-12 shrink-0 border-l border-[#1e1e1e] bg-[#0d0d0d] flex flex-col items-center pt-4">
        <button
          onClick={() => setCollapsed(false)}
          className="w-8 h-8 rounded-lg bg-[#111] border border-[#1e1e1e] flex items-center justify-center text-[#555] hover:text-[#e8e8e8] hover:border-[#2a2a2a] transition-all mb-2"
        >
          <ChevronLeft size={12} />
        </button>
        <button
          title="Workflow History"
          className="w-8 h-8 rounded-lg flex items-center justify-center text-[#555]"
        >
          <History size={14} />
        </button>
      </aside>
    );
  }

  return (
    <aside className="w-[292px] shrink-0 border-l border-[#1e1e1e] bg-[#0d0d0d] flex flex-col animate-slide-in">
      {/* Header */}
      <div className="px-4 py-3 border-b border-[#1a1a1a] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <History size={13} className="text-[#555]" />
          <span className="text-xs font-semibold text-[#888] uppercase tracking-wider">
            Run History
          </span>
          {runs.length > 0 && (
            <span className="text-[9px] bg-[#1a1a1a] border border-[#2a2a2a] text-[#555] px-1.5 py-0.5 rounded-full">
              {runs.length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={fetchHistory}
            className="p-1 text-[#444] hover:text-[#888] transition-colors"
            title="Refresh"
          >
            <RefreshCw size={11} className={loading ? "animate-spin" : ""} />
          </button>
          <button
            onClick={() => setCollapsed(true)}
            className="p-1 text-[#444] hover:text-[#888] transition-colors"
          >
            <ChevronRight size={11} />
          </button>
        </div>
      </div>

      {/* Run list */}
      <div className="flex-1 overflow-y-auto">
        {!workflowId ? (
          <div className="flex flex-col items-center justify-center h-40 text-center px-6">
            <History size={24} className="text-[#222] mb-3" />
            <p className="text-xs text-[#333]">Save your workflow to see run history</p>
          </div>
        ) : runs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-center px-6">
            <Clock size={24} className="text-[#222] mb-3" />
            <p className="text-xs text-[#333]">No runs yet. Click Run to execute.</p>
          </div>
        ) : (
          <div className="divide-y divide-[#111]">
            {runs.map((run, i) => (
              <RunEntry
                key={run.id}
                run={run}
                index={runs.length - i}
                expanded={expandedRunId === run.id}
                onToggle={() =>
                  setExpandedRunId(expandedRunId === run.id ? null : run.id)
                }
                statusIcon={statusIcon}
                statusBadge={statusBadge}
                nodeStatusIcon={nodeStatusIcon}
              />
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}

function RunEntry({
  run,
  index,
  expanded,
  onToggle,
  statusIcon,
  statusBadge,
  nodeStatusIcon,
}: {
  run: WorkflowRun;
  index: number;
  expanded: boolean;
  onToggle: () => void;
  statusIcon: (s: string) => React.ReactNode;
  statusBadge: (s: string) => React.ReactNode;
  nodeStatusIcon: (s: string) => React.ReactNode;
}) {
  const scopeLabel = {
    FULL: "Full Workflow",
    PARTIAL: "Selected Nodes",
    SINGLE: "Single Node",
  }[run.scope] || run.scope;

  return (
    <div className="group">
      <button
        onClick={onToggle}
        className="w-full px-4 py-3 flex items-start gap-2 hover:bg-[#0f0f0f] transition-colors text-left"
      >
        <span className="mt-0.5">{statusIcon(run.status)}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-xs font-medium text-[#aaa]">
              Run #{index}
            </span>
            {statusBadge(run.status)}
          </div>
          <div className="text-[10px] text-[#444] truncate">{scopeLabel}</div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[10px] text-[#333]">
              {formatDistanceToNow(new Date(run.createdAt), { addSuffix: true })}
            </span>
            {run.duration && (
              <span className="text-[10px] text-[#333]">
                · {(run.duration / 1000).toFixed(1)}s
              </span>
            )}
          </div>
        </div>
        <span className="text-[#444] mt-0.5">
          {expanded ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
        </span>
      </button>

      {/* Expanded node-level details */}
      {expanded && run.nodeResults && run.nodeResults.length > 0 && (
        <div className="px-4 pb-3 bg-[#080808] border-t border-[#111] animate-fade-in">
          <div className="text-[9px] text-[#333] uppercase tracking-widest mb-2 pt-2">
            {format(new Date(run.createdAt), "MMM d, yyyy h:mm a")} · {scopeLabel}
          </div>
          <div className="space-y-1">
            {(run.nodeResults as NodeResult[]).map((result, idx) => (
              <div key={result.nodeId} className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="text-[#333] text-[10px] font-mono">
                    {idx === run.nodeResults.length - 1 ? "└─" : "├─"}
                  </span>
                  {nodeStatusIcon(result.status)}
                  <span className="text-[10px] text-[#666] flex-1 truncate">
                    {result.nodeLabel}
                  </span>
                  {result.duration && (
                    <span className="text-[9px] text-[#333]">
                      {(result.duration / 1000).toFixed(1)}s
                    </span>
                  )}
                </div>
                {(result.output || result.error) && (
                  <div className="ml-6 mt-0.5">
                    <div className="text-[9px] text-[#333] font-mono truncate max-w-[200px]">
                      {result.error ? (
                        <span className="text-red-400/60">✕ {result.error.slice(0, 60)}</span>
                      ) : (
                        <span className="text-[#2a2a2a]">
                          └── {String(result.output).slice(0, 50)}
                          {String(result.output).length > 50 ? "…" : ""}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
