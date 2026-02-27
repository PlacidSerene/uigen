# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run setup        # Install dependencies + Prisma setup (first-time)
npm run dev          # Start dev server with Turbopack
npm run build        # Production build
npm run lint         # ESLint
npm run test         # Run all Vitest tests
npm run db:reset     # Reset SQLite database
```

To run a single test file:
```bash
npx vitest run src/lib/__tests__/file-system.test.ts
```

Environment: copy `.env.example` to `.env` and add `ANTHROPIC_API_KEY` (optional — omitting it activates a mock model that returns static components).

## Architecture

UIGen is a Next.js 15 App Router app that generates React components via AI (Claude) and renders them live in a sandboxed iframe.

### Core Data Flow

1. User sends a prompt → `/api/chat` (streaming route) using Vercel AI SDK `streamText()`
2. Claude calls `str_replace_editor` / `file_manager` tools to create/modify files
3. `FileSystemContext` intercepts tool calls and mutates the `VirtualFileSystem` (in-memory, no disk I/O)
4. `JSXTransformer` compiles files with Babel standalone and generates an import map
5. `PreviewFrame` re-renders the iframe via blob URLs + import map

### Key Abstractions

**`VirtualFileSystem`** (`src/lib/file-system.ts`) — In-memory tree of files/directories. All "file operations" operate here; nothing touches the real filesystem.

**`FileSystemContext`** (`src/lib/contexts/file-system-context.tsx`) — React context wrapping `VirtualFileSystem`. Exposes file operations and handles tool call results from the AI stream.

**`ChatContext`** (`src/lib/contexts/chat-context.tsx`) — Wraps Vercel AI SDK's `useChat`. Drives message streaming and bridges tool results back to `FileSystemContext`.

**`JSXTransformer`** (`src/lib/transform/jsx-transformer.ts`) — Transpiles JSX to browser JS, resolves `@/` path aliases, and maps unknown npm imports to `esm.sh` CDN URLs.

**AI Tools** (`src/lib/tools/`) — Zod-validated tool schemas for `str_replace_editor` (create/edit files) and `file_manager` (delete/rename).

**Language Model Provider** (`src/lib/provider.ts`) — Returns `claude-haiku-4-5` when `ANTHROPIC_API_KEY` is set, otherwise returns a `MockLanguageModel`.

### Auth & Persistence

- JWT sessions stored in `httpOnly` cookie (`auth-token`), managed in `src/lib/auth.ts`
- Prisma with SQLite (`prisma/dev.db`) — schema has `User` and `Project` models
- `Project.data` stores serialized `VirtualFileSystem`; `Project.messages` stores chat history (both as JSON strings)
- Anonymous users work entirely in-memory; authenticated users persist on generation completion

### UI Layout

`MainContent` uses `react-resizable-panels` for a two-column layout: Chat (left, 35%) and Preview/Code (right, 65%). The right panel tabs between a live iframe preview and a Monaco editor + file tree.

### Path Alias

`@/*` maps to `src/*` (configured in `tsconfig.json` and shadcn's `components.json`).

## Code Style

Use comments sparingly. Only comment complex code.

### Testing

Tests live alongside source in `__tests__/` subdirectories. Framework is Vitest with jsdom + `@testing-library/react`.
