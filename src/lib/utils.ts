import { clsx as clsxBase, type ClassValue } from "clsx";

export function clsx(...inputs: ClassValue[]) {
  return clsxBase(...inputs);
}

let counter = 0;
export function nanoid(): string {
  return `node_${Date.now()}_${++counter}_${Math.random().toString(36).slice(2, 7)}`;
}

export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

export function truncate(str: string, max = 80): string {
  if (!str) return "";
  return str.length <= max ? str : str.slice(0, max) + "…";
}
