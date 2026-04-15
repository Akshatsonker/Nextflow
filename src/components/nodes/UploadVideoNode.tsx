"use client";

import React, { useRef, useState } from "react";
import { Handle, Position, type NodeProps } from "reactflow";
import { Video, Upload, Loader2, X, Play } from "lucide-react";
import { NodeWrapper } from "./NodeWrapper";
import { useWorkflowStore } from "@/store/workflow";
import type { UploadVideoNodeData } from "@/types";

export function UploadVideoNode({ id, data, selected }: NodeProps<UploadVideoNodeData>) {
  const { updateNodeData } = useWorkflowStore();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (file: File) => {
    if (!file) return;

    setUploading(true);
    setError("");

    try {
      // ✅ STEP 1: get signed params
      const paramsRes = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "video" }),
      });

      const { params, signature } = await paramsRes.json();

      // ✅ STEP 2: upload to Transloadit
      const formData = new FormData();
      formData.append("params", params);
      formData.append("signature", signature);
      formData.append("file", file);

      const uploadRes = await fetch("https://api2.transloadit.com/assemblies", {
        method: "POST",
        body: formData,
      });

      const uploadData = await uploadRes.json();

      if (!uploadData.assembly_ssl_url) {
        console.log("UPLOAD ERROR:", uploadData);
        throw new Error("Upload failed");
      }

      const assemblyUrl = uploadData.assembly_ssl_url;

      // ✅ STEP 3: poll for result
      let attempts = 0;

      while (attempts < 40) {
        await new Promise((r) => setTimeout(r, 2000));

        const poll = await fetch(assemblyUrl).then((r) => r.json());

        if (
          poll.ok === "ASSEMBLY_EXECUTING" ||
          poll.ok === "ASSEMBLY_COMPLETED"
        ) {
          const file = poll.uploads?.[0];
          const url = file?.ssl_url || file?.url;

          if (url) {
            updateNodeData(id, {
              videoUrl: url,
              fileName: file.original_name,
              output: url,
            } as Partial<UploadVideoNodeData>);
          }

          if (poll.ok === "ASSEMBLY_COMPLETED") break;
        }

        if (poll.error) {
          console.log("POLL ERROR:", poll);
          setError(poll.error);
          break;
        }

        attempts++;
      }
    } catch (err: any) {
      console.error("UPLOAD ERROR:", err);
      setError(err.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const clearVideo = () => {
    updateNodeData(id, {
      videoUrl: undefined,
      fileName: undefined,
      output: undefined,
    } as Partial<UploadVideoNodeData>);
  };

  return (
    <div className={selected ? "selected" : ""}>
      <NodeWrapper
        nodeId={id}
        status={data.status}
        label="Upload Video"
        icon={<Video size={10} />}
        iconBg="bg-orange-600"
      >
        {data.videoUrl ? (
          <div className="relative group">
            <video
              src={data.videoUrl}
              controls
              className="w-full rounded-lg border border-[#2a2a2a] max-h-36"
            />
            <button
              onClick={clearVideo}
              className="absolute top-1.5 right-1.5 w-6 h-6 bg-black/70 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600/80"
            >
              <X size={10} />
            </button>
            <div className="mt-1.5 text-[10px] text-[#555] truncate">
              {data.fileName}
            </div>
          </div>
        ) : (
          <div>
            <input
              ref={inputRef}
              type="file"
              accept="video/mp4,video/quicktime,video/webm,video/x-m4v"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleUpload(file);
              }}
            />

            <button
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="w-full h-24 border border-dashed border-[#2a2a2a] rounded-lg flex flex-col items-center justify-center gap-2 text-[#444] hover:text-[#666] hover:border-[#3a3a3a] transition-all cursor-pointer group"
            >
              {uploading ? (
                <>
                  <Loader2 size={16} className="animate-spin text-orange-500" />
                  <span className="text-[10px]">Uploading…</span>
                  <span className="text-[9px] text-[#333]">
                    Video processing may take a minute
                  </span>
                </>
              ) : (
                <>
                  <Play size={16} className="group-hover:text-orange-400 transition-colors" />
                  <span className="text-[10px]">Click to upload video</span>
                  <span className="text-[9px] text-[#333]">
                    mp4, mov, webm, m4v
                  </span>
                </>
              )}
            </button>

            {error && (
              <p className="text-[10px] text-red-400 mt-1.5">{error}</p>
            )}
          </div>
        )}
      </NodeWrapper>

      <Handle
        type="source"
        position={Position.Right}
        id="output"
        style={{ top: "50%" }}
      />
    </div>
  );
}