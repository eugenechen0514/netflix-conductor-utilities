# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A non-official TypeScript library for Netflix Conductor (workflow orchestration engine). Provides task worker, metadata management, and workflow management utilities. Published to npm as `netflix-conductor-utilities`.

Supports both Conductor V2 (with task ack) and V3 (without task ack, controlled by `needAckTask` option).

## Commands

```bash
# Build (compiles TypeScript to dist/)
npm run dist

# Watch mode during development
npm run dev

# Run all tests (requires a running Conductor server at localhost:8080)
npm test

# Run a single test file
npx mocha --require ts-node/register tests/ConductorWorker.test.ts

# Format code
npm run prettier

# Publish (build + npm publish)
npm run deploy
```

## Architecture

### Core Classes (all in `src/`)

- **ConductorWorker** (`ConductorWorker.ts`) — The main worker class. Polls tasks from Conductor, executes user-defined work functions, and reports results back. Generic over `<OUTPUT, INPUT, CTX>`. Extends `EventEmitter`. Uses `run-forever` for polling loop and `superchain` Bucketchain for middleware pipeline.
- **RunningTask** (`RunningTask.ts`) — Represents an in-progress task. Handles keep-alive heartbeat timer (`keepAliveTimer`) to prevent Conductor from timing out long-running tasks. Provides `sendLog()` to push logs back to Conductor.
- **TaskMetadataManager** (`TaskMetadataManager.ts`) — CRUD for task definitions via Conductor `/metadata/taskdefs` API.
- **WorkflowMetadataManager** (`WorkflowMetadataManager.ts`) — CRUD for workflow definitions via Conductor `/metadata/workflow` API.
- **WorkflowManager** (`WorkflowManager.ts`) — Workflow operations: start, terminate, pause, resume, restart, retry, rerun, skip task.

### Middleware System

`ConductorWorker.use(middleware)` adds middleware to the `pre` bucket. Middleware runs before the work function. Supports both promise-based and callback-based signatures. Context (`ctx`) flows through the chain, carrying `input`, `pollTask`, `runningTask`, and custom fields.

The chain is built on `superchain` Bucketchain. Internal context mapping is in `src/utils/chainUtils.ts`.

### Type System

`src/types.ts` contains all Conductor API types: task/workflow definitions, metadata interfaces, task states, workflow statuses, and all workflow task type variants (SIMPLE, SUB_WORKFLOW, DECISION, FORK_JOIN, etc.).

### Key Patterns

- All API clients use `axios` instances created with `baseURL`.
- Metadata managers use `ConductorSDKOptions` (`{ apiEndpoint }`) while `ConductorWorker` uses `ConductorWorkerOptions` (`{ url, apiPath }`). These are different config shapes.
- Logging uses the `debug` package with namespace `netflix-conductor-utilities`.
- Module system: CommonJS (`module: "commonjs"`, target ES2015). Be cautious with ESM-only dependencies.

## Code Style

- Prettier: 120 char width, single quotes, semicolons, trailing commas.
- Each class file exports both `default` and named export (e.g., `export default ConductorWorker; export { ConductorWorker }`).
- Entry point `src/index.ts` re-exports everything via `export *`.

## Testing

Tests use **Mocha + Chai** and require a live Conductor server at `http://localhost:8080`. They are integration tests that register real tasks/workflows and run workers against the server.
