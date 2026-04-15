# NextFlow — LLM Workflow Builder

A pixel-perfect Krea.ai-inspired visual workflow builder for LLM pipelines. Built with Next.js 14, React Flow, Clerk, Trigger.dev, Transloadit, and Google Gemini.

---

## Quick Start

```bash
git clone <your-repo>
cd nextflow
npm install
cp .env.example .env.local
# Fill in API keys (see SETUP.md)
npm run db:push
npx trigger.dev@latest deploy
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Tech Stack

| Technology | Role |
|------------|------|
| Next.js 14 (App Router) | React framework |
| TypeScript | Type safety throughout |
| ReactFlow | Visual workflow canvas |
| Clerk | Authentication |
| Trigger.dev | All node execution (LLM, FFmpeg) |
| Transloadit | File uploads & media processing |
| Google Gemini | LLM inference with vision |
| PostgreSQL (Neon) | Database |
| Prisma | ORM |
| Zustand + Immer | State management |
| Zod | Schema validation |
| Tailwind CSS | Styling |
| Lucide React | Icons |

---

## Node Types

| Node | Description |
|------|-------------|
| **Text** | Text input / prompt — output handle for text data |
| **Upload Image** | Upload jpg/png/webp/gif via Transloadit |
| **Upload Video** | Upload mp4/mov/webm via Transloadit with preview |
| **Run LLM** | Google Gemini with vision support via Trigger.dev |
| **Crop Image** | FFmpeg crop via Trigger.dev, configurable x/y/w/h% |
| **Extract Frame** | FFmpeg frame extraction via Trigger.dev, timestamp or % |

---

## Features

- **Parallel DAG execution** — independent branches run concurrently
- **Type-safe connections** — image outputs can't connect to text handles
- **Cycle detection** — circular dependencies blocked at connection time
- **Pulsating glow** on nodes during execution
- **Selective execution** — run all / selected / single node
- **Workflow history** — right sidebar with node-level results
- **Save/load** to PostgreSQL, export/import JSON
- **Undo/Redo** via keyboard (Ctrl+Z / Ctrl+Shift+Z)
- **Minimap** + pan/zoom canvas navigation

---

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Ctrl/Cmd + S` | Save workflow |
| `Delete` / `Backspace` | Delete selected nodes |
| `Shift + Click` | Multi-select nodes |
| `Scroll wheel` | Zoom |
| `Drag background` | Pan |

---

See **SETUP.md** for full configuration guide.
