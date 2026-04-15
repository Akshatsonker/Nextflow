"use client";

import React, { useState, useCallback, useEffect } from "react";
import { UserButton } from "@clerk/nextjs";
import {
  Play, Save, Download, Upload, Loader2, ChevronDown,
  CheckCircle2, AlertCircle, Zap, Layers,
} from "lucide-react";
import { useWorkflowStore } from "@/store/workflow";
import { useRunWorkflow } from "@/components/canvas/useRunWorkflow";
import clsx from "clsx";

export function TopBar() {
  const {
    workflowName, setWorkflowName,
    selectedNodeIds, isRunning, isSaving,
    workflowId, nodes, edges,
    setWorkflowId, setIsSaving, loadWorkflow,
  } = useWorkflowStore();

  const { runWorkflow } = useRunWorkflow();
  const [runMenuOpen, setRunMenuOpen] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saved" | "error">("idle");
  const [editingName, setEditingName] = useState(false);
  const [loadingSample, setLoadingSample] = useState(false);

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/workflow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: workflowId || undefined,
          name: workflowName,
          nodes,
          edges,
        }),
      });
      const data = await res.json();
      if (data.id && !workflowId) setWorkflowId(data.id);
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2500);
    } catch {
      setSaveStatus("error");
      setTimeout(() => setSaveStatus("idle"), 3000);
    } finally {
      setIsSaving(false);
    }
  }, [workflowId, workflowName, nodes, edges, setWorkflowId, setIsSaving]);

  // Ctrl/Cmd+S
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        handleSave();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [handleSave]);

  const handleExport = () => {
    const blob = new Blob(
      [JSON.stringify({ name: workflowName, nodes, edges }, null, 2)],
      { type: "application/json" }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${workflowName.replace(/\s+/g, "-").toLowerCase()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      try {
        const data = JSON.parse(await file.text());
        loadWorkflow({ name: data.name || "Imported Workflow", nodes: data.nodes || [], edges: data.edges || [] });
      } catch {
        alert("Invalid workflow JSON");
      }
    };
    input.click();
  };

  const handleLoadSample = async () => {
    if (nodes.length > 0 && !confirm("Load sample workflow? This will replace the current canvas.")) return;
    setLoadingSample(true);
    try {
      const res = await fetch("/api/workflow/sample", { method: "POST" });
      const data = await res.json();
      loadWorkflow({ id: data.id, name: data.name, nodes: data.nodes, edges: data.edges });
      setWorkflowId(data.id);
    } catch {
      alert("Failed to load sample — check your database connection.");
    } finally {
      setLoadingSample(false);
    }
  };

  return (
    <header className="h-12 flex items-center px-4 gap-2.5 border-b border-[#181818] bg-[#0a0a0a] shrink-0 z-50 select-none">
      {/* Logo */}
      <div className="flex items-center gap-2 mr-1 shrink-0">
        <div className="w-[26px] h-[26px] rounded-md bg-purple-600 flex items-center justify-center shadow-lg shadow-purple-900/40">
          <Zap size={12} color="white" fill="white" />
        </div>
        <span className="text-[13px] font-semibold text-white tracking-tight hidden sm:block">
          NextFlow
        </span>
      </div>

      {/* Separator */}
      <div className="w-px h-5 bg-[#222] mx-0.5" />

      {/* Workflow name editor */}
      <div className="flex items-center min-w-0 max-w-[240px]">
        {editingName ? (
          <input
            autoFocus
            value={workflowName}
            onChange={(e) => setWorkflowName(e.target.value)}
            onBlur={() => setEditingName(false)}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === "Escape") setEditingName(false); }}
            className="bg-[#1a1a1a] border border-purple-600/50 rounded px-2 py-0.5 text-[13px] text-white w-full focus:outline-none"
          />
        ) : (
          <button
            onClick={() => setEditingName(true)}
            className="text-[13px] text-[#888] hover:text-[#ccc] truncate px-1 py-0.5 rounded hover:bg-[#151515] transition-colors text-left"
            title="Click to rename"
          >
            {workflowName}
          </button>
        )}
      </div>

      <div className="flex-1" />

      {/* Sample workflow loader */}
      <button
        onClick={handleLoadSample}
        disabled={loadingSample}
        title="Load Product Marketing Kit sample workflow"
        className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded text-[11px] text-[#555] bg-[#0f0f0f] border border-[#1a1a1a] hover:text-[#888] hover:border-[#252525] transition-all"
      >
        {loadingSample
          ? <Loader2 size={10} className="animate-spin" />
          : <Layers size={10} />}
        Sample
      </button>

      {/* Import */}
      <button
        onClick={handleImport}
        title="Import workflow JSON"
        className="p-1.5 text-[#555] hover:text-[#999] hover:bg-[#151515] rounded transition-all"
      >
        <Upload size={14} />
      </button>

      {/* Export */}
      <button
        onClick={handleExport}
        title="Export workflow JSON"
        className="p-1.5 text-[#555] hover:text-[#999] hover:bg-[#151515] rounded transition-all"
      >
        <Download size={14} />
      </button>

      {/* Save */}
      <button
        onClick={handleSave}
        disabled={isSaving}
        className={clsx(
          "flex items-center gap-1.5 px-3 py-1.5 rounded text-[11px] font-medium transition-all",
          saveStatus === "saved"
            ? "bg-green-600/10 text-green-400 border border-green-600/20"
            : saveStatus === "error"
            ? "bg-red-600/10 text-red-400 border border-red-600/20"
            : "bg-[#0f0f0f] border border-[#1a1a1a] text-[#666] hover:text-[#aaa] hover:border-[#252525]"
        )}
      >
        {isSaving ? <Loader2 size={11} className="animate-spin" />
          : saveStatus === "saved" ? <CheckCircle2 size={11} />
          : saveStatus === "error" ? <AlertCircle size={11} />
          : <Save size={11} />}
        {saveStatus === "saved" ? "Saved" : saveStatus === "error" ? "Error" : "Save"}
      </button>

      {/* Run split button */}
      <div className="relative flex items-center">
        <button
          onClick={() => { setRunMenuOpen(false); runWorkflow("FULL"); }}
          disabled={isRunning || nodes.length === 0}
          className={clsx(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-l text-[11px] font-medium transition-all",
            isRunning
              ? "bg-purple-900/50 text-purple-300/60 cursor-not-allowed"
              : nodes.length === 0
              ? "bg-purple-900/30 text-purple-400/40 cursor-not-allowed"
              : "bg-purple-600 hover:bg-purple-500 text-white shadow-md shadow-purple-900/30"
          )}
        >
          {isRunning
            ? <Loader2 size={11} className="animate-spin" />
            : <Play size={11} fill="currentColor" />}
          {isRunning ? "Running…" : "Run All"}
        </button>
        <button
          onClick={() => setRunMenuOpen((v) => !v)}
          disabled={isRunning}
          className={clsx(
            "px-1.5 py-1.5 rounded-r text-white border-l border-purple-500/40 transition-all",
            isRunning
              ? "bg-purple-900/50 cursor-not-allowed"
              : "bg-purple-600 hover:bg-purple-500"
          )}
        >
          <ChevronDown size={11} />
        </button>

        {runMenuOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setRunMenuOpen(false)} />
            <div className="absolute right-0 top-full mt-1.5 w-52 bg-[#141414] border border-[#252525] rounded-lg shadow-2xl z-50 overflow-hidden animate-fade-in">
              <div className="px-3 py-2 border-b border-[#1e1e1e]">
                <span className="text-[9px] text-[#444] uppercase tracking-widest font-semibold">Execute</span>
              </div>

              <button
                onClick={() => { setRunMenuOpen(false); runWorkflow("FULL"); }}
                className="w-full px-3 py-2.5 text-left flex items-start gap-2.5 hover:bg-[#1a1a1a] transition-colors"
              >
                <Play size={10} fill="currentColor" className="text-purple-400 mt-0.5 shrink-0" />
                <div>
                  <div className="text-[11px] font-medium text-[#ccc]">Run Full Workflow</div>
                  <div className="text-[9px] text-[#444] mt-0.5">All {nodes.length} nodes in parallel waves</div>
                </div>
              </button>

              <div className="h-px bg-[#1a1a1a]" />

              <button
                onClick={() => { setRunMenuOpen(false); runWorkflow("PARTIAL"); }}
                disabled={selectedNodeIds.length === 0}
                className="w-full px-3 py-2.5 text-left flex items-start gap-2.5 hover:bg-[#1a1a1a] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <Play size={10} fill="currentColor" className="text-blue-400 mt-0.5 shrink-0" />
                <div>
                  <div className="text-[11px] font-medium text-[#ccc]">Run Selected</div>
                  <div className="text-[9px] text-[#444] mt-0.5">
                    {selectedNodeIds.length > 0
                      ? `${selectedNodeIds.length} node${selectedNodeIds.length > 1 ? "s" : ""} selected`
                      : "Shift+click to select nodes"}
                  </div>
                </div>
              </button>

              <div className="h-px bg-[#1a1a1a]" />

              <button
                onClick={() => { setRunMenuOpen(false); runWorkflow("SINGLE"); }}
                disabled={selectedNodeIds.length !== 1}
                className="w-full px-3 py-2.5 text-left flex items-start gap-2.5 hover:bg-[#1a1a1a] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <Play size={10} fill="currentColor" className="text-green-400 mt-0.5 shrink-0" />
                <div>
                  <div className="text-[11px] font-medium text-[#ccc]">Run Single Node</div>
                  <div className="text-[9px] text-[#444] mt-0.5">Select exactly 1 node first</div>
                </div>
              </button>
            </div>
          </>
        )}
      </div>

      {/* User avatar */}
      <UserButton
        appearance={{
          elements: {
            avatarBox: "w-7 h-7 rounded-full",
            userButtonPopoverCard: "bg-[#141414] border border-[#252525] shadow-2xl",
            userButtonPopoverActionButton: "hover:bg-[#1a1a1a]",
          },
        }}
      />
    </header>
  );
}
