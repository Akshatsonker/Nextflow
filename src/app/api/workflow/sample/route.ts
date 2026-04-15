import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Sample workflow node/edge definitions (mirrored from seed script)
const SAMPLE_NODES = [
  {
    id: "node-upload-image",
    type: "upload_image",
    position: { x: 60, y: 80 },
    data: { type: "upload_image", label: "Upload Image", status: "idle" },
  },
  {
    id: "node-crop",
    type: "crop_image",
    position: { x: 380, y: 80 },
    data: {
      type: "crop_image",
      label: "Crop Image",
      xPercent: 10,
      yPercent: 10,
      widthPercent: 80,
      heightPercent: 80,
      status: "idle",
    },
  },
  {
    id: "node-text-system",
    type: "text",
    position: { x: 60, y: 320 },
    data: {
      type: "text",
      label: "Text",
      text: "You are a professional marketing copywriter. Generate a compelling one-paragraph product description.",
      status: "idle",
    },
  },
  {
    id: "node-text-product",
    type: "text",
    position: { x: 380, y: 320 },
    data: {
      type: "text",
      label: "Text",
      text: "Product: Wireless Bluetooth Headphones. Features: Noise cancellation, 30-hour battery, foldable design.",
      status: "idle",
    },
  },
  {
    id: "node-llm-1",
    type: "llm",
    position: { x: 700, y: 180 },
    data: {
      type: "llm",
      label: "Run LLM",
      model: "gemini-1.5-flash",
      systemPrompt: "",
      userMessage: "",
      status: "idle",
    },
  },
  {
    id: "node-upload-video",
    type: "upload_video",
    position: { x: 60, y: 580 },
    data: { type: "upload_video", label: "Upload Video", status: "idle" },
  },
  {
    id: "node-extract-frame",
    type: "extract_frame",
    position: { x: 380, y: 580 },
    data: {
      type: "extract_frame",
      label: "Extract Frame",
      timestamp: "50%",
      status: "idle",
    },
  },
  {
    id: "node-text-social",
    type: "text",
    position: { x: 700, y: 560 },
    data: {
      type: "text",
      label: "Text",
      text: "You are a social media manager. Create a tweet-length marketing post based on the product image and video frame.",
      status: "idle",
    },
  },
  {
    id: "node-llm-2",
    type: "llm",
    position: { x: 1040, y: 360 },
    data: {
      type: "llm",
      label: "Run LLM",
      model: "gemini-1.5-pro",
      systemPrompt: "",
      userMessage: "",
      status: "idle",
    },
  },
];

const SAMPLE_EDGES = [
  { id: "e1", source: "node-upload-image", target: "node-crop", sourceHandle: "output", targetHandle: "image_url", style: { stroke: "#a855f7", strokeWidth: 2 } },
  { id: "e2", source: "node-text-system", target: "node-llm-1", sourceHandle: "output", targetHandle: "system_prompt", style: { stroke: "#a855f7", strokeWidth: 2 } },
  { id: "e3", source: "node-text-product", target: "node-llm-1", sourceHandle: "output", targetHandle: "user_message", style: { stroke: "#a855f7", strokeWidth: 2 } },
  { id: "e4", source: "node-crop", target: "node-llm-1", sourceHandle: "output", targetHandle: "images", style: { stroke: "#a855f7", strokeWidth: 2 } },
  { id: "e5", source: "node-upload-video", target: "node-extract-frame", sourceHandle: "output", targetHandle: "video_url", style: { stroke: "#a855f7", strokeWidth: 2 } },
  { id: "e6", source: "node-text-social", target: "node-llm-2", sourceHandle: "output", targetHandle: "system_prompt", style: { stroke: "#a855f7", strokeWidth: 2 } },
  { id: "e7", source: "node-llm-1", target: "node-llm-2", sourceHandle: "output", targetHandle: "user_message", style: { stroke: "#a855f7", strokeWidth: 2 } },
  { id: "e8", source: "node-crop", target: "node-llm-2", sourceHandle: "output", targetHandle: "images", style: { stroke: "#a855f7", strokeWidth: 2 } },
  { id: "e9", source: "node-extract-frame", target: "node-llm-2", sourceHandle: "output", targetHandle: "images", style: { stroke: "#a855f7", strokeWidth: 2 } },
];

export async function POST() {
  const { userId } = auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const workflow = await prisma.workflow.create({
    data: {
      userId,
      name: "Product Marketing Kit Generator",
      nodes: JSON.stringify(SAMPLE_NODES),
      edges: JSON.stringify(SAMPLE_EDGES),
    },
  });

  return NextResponse.json({
    id: workflow.id,
    name: workflow.name,
    nodes: SAMPLE_NODES,
    edges: SAMPLE_EDGES,
  });
}
