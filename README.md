# Rural Mixed-Grade Nature Classroom

**English** · [中文](README.zh-CN.md)

A natural-science classroom tool for one teacher working with first- and fourth-grade students at the same time. It connects real campus settings, younger students' evidence collection, older students' reasoning, and teacher assessment into a reusable lesson workflow.

## Current codebase (prototype implementation)

This repository currently contains a Next.js prototype with the frontend and backend in one codebase, primarily for validating classroom workflows and interactions:

- `app/`: Next.js 14 App Router pages and server-side APIs. Pages cover the home screen; teacher preparation, preview, and monitoring; fourth-grade preparation, collage-making, explanations, and journals; and first-grade mobile evidence collection and sign-based questions.
- `components/`: Shared UI, animations, and campus map components (`ui.tsx`, `Map.tsx`).
- `lib/types.ts`: Types for classroom sessions, tasks, evidence, map regions, stickers, and explanation results.
- `lib/storage.ts`: Reads and writes local session JSON using Node.js `fs/promises`, and stores images, stickers, and background assets.
- `lib/ai.ts`: Wraps OpenAI-compatible multimodal calls, visual region recognition, task generation, evidence recognition, answer assessment, explanations of relationships in nature, and image stylization.
- `app/api/`: Endpoints for session management, task generation and polling, evidence uploads, map analysis, sticker generation, collage submission, and answer assessment.
- `data/sessions/`, `public/uploads/`: Local data and asset directories used by the prototype.

The core classroom journey is: create a class → the teacher selects a theme and uploads a scene → AI generates tasks for both grades → the teacher previews and publishes them → first-grade students collect evidence on phones → fourth-grade students answer preparatory questions and build collages by dragging and dropping → AI explains relationships in nature → the results are saved in nature journals.

### Run the prototype

Next.js currently serves both the pages and APIs:

```bash
npm install
npm run dev
```

Open `http://localhost:3000` by default. AI calls use an OpenAI-compatible gateway, and image stylization can use Replicate. Without configured keys, some features return demonstration fallback results.

## Target architecture (planned replacement)

The planned product uses a React + Python full-stack architecture, with models available in mainland China as its AI foundation. A structured workflow connects scene understanding, task breakdown, student evidence collection, assessment, and reusable lesson records.

- **Frontend:** React + TypeScript + Vite, with Tailwind CSS / Ant Design, supporting teacher screens, tablets, and phones. Student interfaces prioritize fewer screens, minimal typing, large buttons, and low cognitive load.
- **Backend:** Python + FastAPI. Domain services cover lesson task orchestration, scene and safety assessment, image processing, assessment by an AI science companion, and nature journals. Teacher and student clients connect through clear REST/JSON interfaces.
- **AI and vision:** Planned integrations include DeepSeek, Doubao, Qwen, and other models available in mainland China, supporting image understanding, object extraction, scene-region recognition, cartoon asset generation, and structured reasoning. Outputs are constrained by JSON Schema to support validation, retries, auditing, and teacher edits.
- **Data and deployment:** SQLite for development, weak-network, and single-machine modes; PostgreSQL for collaboration and production deployment. Original photos, generated assets, and lesson attachments go into object storage. Services are deployed to the cloud with Docker, with provisions for offline caching, resumable uploads, and a single-machine fallback.
- **Engineering constraints:** AI results must pass schema validation and safety filtering. Teacher review remains part of task publication, assessment, and external publication. Student interactions favor selection, photography, and drag-and-drop over long text input. Key classroom state supports idempotent writes and recovery.

## Migration priorities

1. Move pages from `app/` to a Vite React frontend while retaining existing classroom workflows and component interactions.
2. Move capabilities from `app/api/` and `lib/ai.ts` into FastAPI domain services, with consistent request/response models and JSON Schema.
3. Replace local JSON sessions with SQLite/PostgreSQL, and replace `public/uploads/` with an object-storage adapter.
4. Add teacher review, permissions, operation logs, weak-network caching, and task retries, then standardize deployment with Docker.

## Main environment variables (prototype)

```env
OPENAI_API_KEY=...
OPENAI_BASE_URL=...
OPENAI_MODEL=...
REPLICATE_API_TOKEN=...
```

When implementing the target architecture, replace these settings with a unified adapter configuration for the chosen mainland-China model providers, and separate keys and timeout policies by service.

## Team

- **Team Lead:** Estelle Ma
- **Core members:** Chenyi Nie, Mona Li, Hangning Liu
