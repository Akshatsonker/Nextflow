"use client";

import React, { useRef, useState } from "react";
import { Handle, Position, type NodeProps } from "reactflow";
import { Image, Upload, Loader2, X } from "lucide-react";
import { NodeWrapper } from "./NodeWrapper";
import { useWorkflowStore } from "@/store/workflow";
import type { UploadImageNodeData } from "@/types";

export function UploadImageNode({ id, data, selected }: NodeProps<UploadImageNodeData>) {
  const { updateNodeData } = useWorkflowStore();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (file: File) => {
  if (!file) return;

  setUploading(true);
  setError("");

  try {
    // 🔹 get signed params
    const resParams = await fetch("/api/upload", {
      method: "POST",
    });

    const { params, signature } = await resParams.json();

    const formData = new FormData();
    formData.append("params", params);
    formData.append("signature", signature);
    formData.append("file", file);

    // 🔹 upload
    const res = await fetch("https://api2.transloadit.com/assemblies", {
      method: "POST",
      body: formData,
    });

   const text = await res.text();
console.log("TRANSLOADIT RESPONSE:", text);

let data;
try {
  data = JSON.parse(text);
} catch {
  throw new Error("Invalid JSON response");
}

    if (!data.assembly_ssl_url) {
      console.log("UPLOAD ERROR:", data);
      throw new Error("Upload failed");
    }

    const assemblyUrl = data.assembly_ssl_url;

    // 🔹 poll
    let attempts = 0;

    while (attempts < 20) {
      await new Promise((r) => setTimeout(r, 1500));

      const poll = await fetch(assemblyUrl).then((r) => r.json());

      if (poll.ok === "ASSEMBLY_COMPLETED") {
       const file = poll.uploads?.[0];
const url = file?.ssl_url || file?.url;

        updateNodeData(id, {
          imageUrl: url,
          fileName: file.original_name,
          output: url,
        });

        break;
      }

      attempts++;
    }
  } catch (err: any) {
    setError(err.message);
  } finally {
    setUploading(false);
  }
};

  const clearImage = () => {
    updateNodeData(id, {
      imageUrl: undefined,
      fileName: undefined,
      output: undefined,
    } as Partial<UploadImageNodeData>);
  };

  return (
    <div className={selected ? "selected" : ""}>
      <NodeWrapper
        nodeId={id}
        status={data.status}
        label="Upload Image"
        icon={<Image size={10} />}
        iconBg="bg-green-600"
      >
        {data.imageUrl ? (
          <div className="relative group">
            <img
              src={data.imageUrl}
              alt={data.fileName || "Uploaded"}
              className="w-full h-32 object-cover rounded-lg border border-[#2a2a2a]"
            />
            <button
              onClick={clearImage}
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
              accept="image/*"
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
                  <Loader2 size={16} className="animate-spin text-green-500" />
                  <span className="text-[10px]">Uploading…</span>
                </>
              ) : (
                <>
                  <Upload size={16} />
                  <span className="text-[10px]">Click to upload image</span>
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