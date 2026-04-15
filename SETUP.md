# NextFlow — Complete Setup Guide

## Prerequisites

- Node.js 18+
- npm or pnpm
- Git

---

## Step 1 — Clone & Install

```bash
git clone <your-repo>
cd nextflow
npm install
```

---

## Step 2 — Get API Keys

### 1. Clerk (Authentication)
1. Sign up at https://clerk.com
2. Create a new application
3. Choose "Email + Password" and social providers
4. Copy **Publishable Key** and **Secret Key** from Dashboard → API Keys

### 2. Neon (PostgreSQL)
1. Sign up at https://neon.tech
2. Create a new project
3. Copy the **Connection String** from the Dashboard
   - It looks like: `postgresql://user:pass@ep-xxx.region.aws.neon.tech/neondb?sslmode=require`

### 3. Trigger.dev
1. Sign up at https://trigger.dev
2. Create a new project named `nextflow`
3. Copy **Secret Key** (`tr_dev_...`) and **Public API Key** (`pk_dev_...`)
4. Deploy your tasks: `npx trigger.dev@latest deploy`

### 4. Transloadit
1. Sign up at https://transloadit.com
2. Go to **API Credentials**
3. Copy your **Auth Key** and **Auth Secret**

### 5. Google Gemini
1. Go to https://aistudio.google.com
2. Click **Get API Key**
3. Create an API key (free tier works)

---

## Step 3 — Configure Environment

```bash
cp .env.example .env.local
```

Fill in `.env.local`:

```env
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/

# Database (Neon PostgreSQL)
DATABASE_URL=postgresql://user:pass@ep-xxx.region.aws.neon.tech/neondb?sslmode=require

# Trigger.dev
TRIGGER_SECRET_KEY=tr_dev_...
NEXT_PUBLIC_TRIGGER_PUBLIC_API_KEY=pk_dev_...
TRIGGER_API_URL=https://api.trigger.dev

# Transloadit
TRANSLOADIT_KEY=your_key_here
TRANSLOADIT_SECRET=your_secret_here

# Google Gemini
GEMINI_API_KEY=AIza...
```

---

## Step 4 — Setup Database

```bash
# Push schema to Neon
npm run db:push

# (Optional) Seed the sample workflow
npx tsx scripts/seed-sample-workflow.ts
```

---

## Step 5 — Deploy Trigger.dev Tasks

```bash
# Install Trigger.dev CLI
npm install -g @trigger.dev/cli

# Login
npx trigger.dev@latest login

# Deploy tasks (LLM, Crop Image, Extract Frame)
npx trigger.dev@latest deploy
```

This makes your tasks available at:
- `llm-node` — calls Gemini API
- `crop-image` — FFmpeg crop via Transloadit
- `extract-frame` — FFmpeg frame extraction via Transloadit

---

## Step 6 — Run Locally

```bash
npm run dev
```

Open http://localhost:3000

---

## Step 7 — Deploy to Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Set environment variables
vercel env add NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
vercel env add CLERK_SECRET_KEY
vercel env add DATABASE_URL
vercel env add TRIGGER_SECRET_KEY
vercel env add NEXT_PUBLIC_TRIGGER_PUBLIC_API_KEY
vercel env add TRANSLOADIT_KEY
vercel env add TRANSLOADIT_SECRET
vercel env add GEMINI_API_KEY

# Redeploy with env vars
vercel --prod
```

---

## How to Use

### Building Workflows

1. **Sign in** with your Clerk account
2. **Drag nodes** from the left sidebar onto the canvas — or click to add at center
3. **Connect nodes** by dragging from an output handle (right side) to an input handle (left side)
4. **Type-safe connections** — invalid connections are automatically rejected:
   - Image outputs → `image_url` or `images` handles only
   - Video outputs → `video_url` handles only
   - Text outputs → `system_prompt`, `user_message`, `timestamp` handles only

### Running Workflows

- **Run All** — executes the entire workflow DAG in parallel waves
- **Run Selected** — select multiple nodes (Shift+click) then run only those
- **Run Single** — select one node and run it in isolation
- Watch the **pulsating purple glow** on nodes currently executing

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + S` | Save workflow |
| `Delete` / `Backspace` | Delete selected nodes |
| `Shift + Click` | Multi-select nodes |
| `Scroll` | Zoom canvas |
| `Drag background` | Pan canvas |

### LLM Node Handles

The LLM node has 3 input handles (color-coded):
- 🟣 **system_prompt** (top-left) — connect a Text node for system instructions
- 🔵 **user_message** (middle-left) — connect a Text node for the prompt
- 🟢 **images** (bottom-left) — connect Image/CropImage/ExtractFrame nodes (supports multiple)

When a handle is connected, the manual input field is disabled (greyed out).

### Workflow History

The right sidebar shows all workflow runs with:
- Timestamp, status (success/failed/partial), duration, scope
- Click any run to expand **node-level execution details**
- See which nodes succeeded, failed, and their outputs

### Export / Import

- Click **↓** (Download) to export your workflow as JSON
- Click **↑** (Upload) to import a workflow from JSON
- Useful for sharing workflows or version control

---

## Sample Workflow: Product Marketing Kit Generator

Load the pre-built sample to see all features working together:

```bash
npx tsx scripts/seed-sample-workflow.ts
```

This creates a workflow with two parallel branches that converge:

```
Branch A (runs in parallel with Branch B):
  Upload Image → Crop Image → LLM Node #1 (product description)
                                    ↘
Branch B (runs in parallel with Branch A):              LLM Node #2 (marketing tweet)
  Upload Video → Extract Frame              ↗
```

---

## Architecture Notes

### Parallel Execution (DAG waves)

The executor (`src/lib/executor.ts`) builds a topological sort of the DAG and identifies **execution waves** — groups of nodes with no dependencies on each other. Each wave runs concurrently via `Promise.allSettled`.

```
Phase 1: [Upload Image, Text Nodes, Upload Video]  ← all parallel
Phase 2: [Crop Image, Extract Frame]               ← parallel
Phase 3: [LLM Node #1]                            ← waits for crop + texts
Phase 4: [LLM Node #2]                            ← waits for both branches
```

### Type-Safe Connections

Connections are validated in `src/store/workflow.ts`:
- Image nodes → only connect to `images` or `image_url` handles
- Video nodes → only connect to `video_url` handles
- Text/LLM output → only connect to text handles

### All Execution via Trigger.dev

Every non-trivial node execution goes through a Trigger.dev task:
- `llm-node` task → Gemini API with optional vision
- `crop-image` task → FFmpeg via Transloadit assembly
- `extract-frame` task → FFmpeg via Transloadit assembly

Text and Upload nodes resolve instantly (no task needed).
