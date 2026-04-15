"use client";

import { useCallback } from "react";
import { useWorkflowStore } from "@/store/workflow";
import type { RunScope, NodeResult } from "@/types";

export function useRunWorkflow() {
  const {
    workflowId,
    workflowName,
    nodes,
    edges,
    selectedNodeIds,
    setIsRunning,
    updateNodeStatus,
    resetNodeStatuses,
    setWorkflowId,
    setIsSaving,
  } = useWorkflowStore();

  const runWorkflow = useCallback(
    async (scope: RunScope) => {
      if (nodes.length === 0) return;

      // Auto-save first
      setIsSaving(true);
      let wfId = workflowId;
      try {
        const saveRes = await fetch("/api/workflow", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: workflowId || undefined,
            name: workflowName,
            nodes,
            edges,
          }),
        });
        const saveData = await saveRes.json();
        if (saveData.id) {
          wfId = saveData.id;
          if (!workflowId) setWorkflowId(saveData.id);
        }
      } catch {
        console.error("Auto-save failed");
      } finally {
        setIsSaving(false);
      }

      if (!wfId) return;

      // Reset statuses
      resetNodeStatuses();
      setIsRunning(true);

      // Mark relevant nodes as running
      const targetIds =
        scope === "FULL"
          ? nodes.map((n) => n.id)
          : selectedNodeIds.length
          ? selectedNodeIds
          : nodes.map((n) => n.id);

      // For text/upload nodes, they're "instant"
      for (const id of targetIds) {
        const node = nodes.find((n) => n.id === id);
        if (node?.data.type === "text" || node?.data.type === "upload_image" || node?.data.type === "upload_video") {
          updateNodeStatus(id, "success");
        } else {
          updateNodeStatus(id, "running");
        }
      }

      try {
        // Trigger the run
        const res = await fetch("/api/run", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            workflowId: wfId,
            scope,
            selectedNodeIds: scope !== "FULL" ? selectedNodeIds : undefined,
            nodes,
            edges,
          }),
        });

        const { runId } = await res.json();

        // Poll for status
        let attempts = 0;
        const poll = async () => {
          if (attempts++ > 60) {
            setIsRunning(false);
            return;
          }

          const statusRes = await fetch(`/api/run/${runId}`);
          const runData = await statusRes.json();

          if (runData.status === "RUNNING") {
            setTimeout(poll, 2000);
            return;
          }

          // Apply node results to UI
          const results: NodeResult[] = runData.nodeResults || [];
          for (const result of results) {
            updateNodeStatus(
              result.nodeId,
              result.status === "success" ? "success" : "error"
            );
            // Update node output data
            if (result.output) {
              useWorkflowStore.getState().updateNodeData(result.nodeId, {
                output: result.output,
              } as any);
            }
          }

          setIsRunning(false);
        };

        setTimeout(poll, 2000);
      } catch (err) {
        console.error("Run failed:", err);
        targetIds.forEach((id) => {
          const node = nodes.find((n) => n.id === id);
          if (node?.data.status === "running") updateNodeStatus(id, "error");
        });
        setIsRunning(false);
      }
    },
    [workflowId, workflowName, nodes, edges, selectedNodeIds]
  );

  return { runWorkflow };
}
