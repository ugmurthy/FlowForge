# AGENTS.md
## Overview

This document outlines the coding agents built using the `amp` CLI from Ampcode (ampcode.com). Amp is an agentic coding tool that leverages frontier AI models for autonomous reasoning, comprehensive code editing, and executing complex tasks. It integrates seamlessly with IDEs like VS Code, Cursor, and Windsurf, enabling efficient development of agentic systems.

In our project—a self-hosted, node-based workflow automation platform inspired by n8n.io—agents are specialized AI components that handle discrete parts of the development process. They operate in a modular, collaborative manner: each agent focuses on a specific domain (e.g., frontend, backend, or integrations), iterates on code via Amp's autonomous editing capabilities, and shares sessions for global collaboration (e.g., via Amp threads and PRs).

## Build/Test Commands
- `pnpm install` - Install all dependencies (both client & server)
- `pnpm build` - Build all packages
- `pnpm test` - Run all tests  
- `pnpm test:client` - Run client tests only
- `pnpm test:server` - Run server tests only
- `pnpm test:watch` - Run tests in watch mode
- `vitest run --reporter=verbose <test-file>` - Run single test file

## Architecture
- **Monorepo** using pnpm workspaces with 2 packages: client (React+Vite) & server (Express)
- **Client**: React 18, Vite, Tailwind CSS, shadcn/ui components, Vitest testing
- **Server**: Express.js with CORS, runs on port 3001, basic health endpoint at `/api/health`
- Path aliases: `@/*` maps to `./src/*` in client package

## Code Style
- **Imports**: Use `@/` alias for client src imports, React imports at top
- **Components**: Functional components with JSX, shadcn/ui components preferred
- **Styling**: Tailwind utility classes, responsive design patterns
- **File naming**: kebab-case for files, PascalCase for React components
- **Types**: TypeScript configs present but using .jsx files currently

### `amp` Threads
Agents are invoked via the `amp` CLI for tasks like generating boilerplate, refactoring, or debugging. All agents share a common configuration:
- **Model**: Frontier LLM (chosen by amp for reasoning).
- **Workspace**: Project root (`./FlowForge`).
- **Prompt Template**: "As a senior [role] engineer building a n8n-like workflow automation tool, [task description]. Use TypeScript/Node.js for backend, React for frontend, and ensure self-hosting compatibility."
- **Iteration Limit**: 5 per task, with human review gates.
- **Output**: Code diffs, Amp thread links, and updated files.

## Core Agents

### 1. Workflow Core Agent
- **Role**: Designs and implements the node-based workflow engine, handling execution graphs, triggers, and data flow.
- **Key Tasks**:
  - Generate node definitions (e.g., HTTP request nodes, conditional branches).
  - Implement execution runtime using libraries `@xyflow/react` version 12 for visual editing or `bullmq` for queuing.
  - Ensure self-hosting via Docker Compose.
- **CLI Invocation**: `amp run workflow-core --task "Build a basic workflow executor that supports drag-and-drop nodes and JSON data piping."`
- **Dependencies**: Node.js, TypeScript, @xyflow/react version 12.
- **Output location**: A `src/core/` .

### 2. Integration Agent
- **Role**: Manages app integrations (10+ like n8n), including API wrappers and credential stores.
- **Key Tasks**:
  - Scaffold integration nodes (e.g., Slack, Salesforce) with OAuth/secret handling.
  - Generate credential encryption using `crypto` module.
  - Test cURL-based requests for new apps.
- **CLI Invocation**: `amp run integrations --task "Create a Slack integration node that supports posting messages and encrypted webhooks."`
- **Dependencies**: Axios for HTTP, `@nestjs/common` for modular structure.
- ** Output location**: `src/integrations/` with mock tests.

### 3. AI Agent Builder
- **Role**: Builds multi-step AI agents within workflows, integrating LLMs for dynamic decision-making.
- **Key Tasks**:
  - Implement LLM nodes (e.g., OpenRouter integration for LLMs) with prompt chaining.
  - Add tool-calling support for agentic workflows (e.g., custom functions).
  - Enable chat interfaces (e.g., embeddable UI for Slack/Teams).
- **CLI Invocation**: `amp run ai-builder --task "Design an AI agent node that chains LLM calls for task decomposition and uses external tools."`
- **Dependencies**: LangChain.js (or equivalent), WebSocket for real-time chat.
- **Example Output**: `src/ai/agent-node.ts` with prompt templates.

### 4. Frontend Agent
- **Role**: Develops the drag-and-drop UI for workflow building, including canvas and node editors.
- **Key Tasks**:
  - Build React components for node palette, canvas rendering, and property editors.
  - Integrate debugging tools (e.g., step re-run, data mocking).
  - Ensure responsive design with white-labeling options.
- **CLI Invocation**: `amp run frontend --task "Create a React-based workflow canvas using React Flow, supporting node connections and inline logs."`
- **Dependencies**: React 18, @xyflow/react version 12, Tailwind CSS.
- **Output location**: `src/frontend/components/`.

### 5. Security & Deployment Agent
- **Role**: Handles enterprise-grade security, self-hosting, and deployment configurations.
- **Key Tasks**:
  - Implement RBAC, SSO (SAML/LDAP), and encrypted secrets.
  - Generate Dockerfiles, Kubernetes manifests, and Git-based version control.
  - Add audit logs and external storage hooks.
- **CLI Invocation**: `amp run security --task "Set up RBAC middleware and Docker deployment for air-gapped self-hosting."`
- **Dependencies**: Passport.js for auth, Docker API.
- **output location**: `docker-compose.yml` and `src/security/`.

### 6. Testing & Debugging Agent
- **Role**: Ensures code quality through automated testing, debugging, and performance optimization.
- **Key Tasks**:
  - Write unit/integration tests for workflows with 80% coverage..
  - Debug issues with inline logs and data replay.
  - Optimize for scalability (e.g., workflow history, log streaming).
- **CLI Invocation**: `amp run testing --task "Add vitest tests for workflow execution and mock data for edge cases."`
- **Dependencies**: vitest.
- **Output location**: `tests/` 

## Collaboration Workflow
- **Agent Orchestration**: Use Amp's session sharing for multi-agent handoffs (e.g., Core Agent passes graph schema to Frontend Agent).
- **Human Oversight**: Agents pause at milestones for review; merge via PRs with embedded Amp threads.
- **Monitoring**: Track agent performance via Amp's global sharing (e.g., https://ampcode.com/threads/[ID]).
- **Extensibility**: New agents can be added by defining a new CLI alias in `amp-config.json`.


