# Implementation Plan for FlowForge MVP

**Objective**: Deliver a Minimum Viable Product (MVP) for FlowForge, a self-hosted, node-based AI workflow automation platform, inspired by n8n.io, using the `amp` CLI from Ampcode for rapid development and assessment. The MVP focuses on core functionality to validate the concept with technical teams and indie developers.

 
**Scope**: Limited to essential features for workflow creation, basic integrations, and self-hosting, with minimal AI capabilities.

---

## 1. Scope & Prioritized Features
Based on the **PRODUCT_SPECIFICATIONS.md**, the MVP will include only high-priority features for quick assessment:

| Category | Feature | Description | Rationale |
|----------|---------|-------------|----------|
| **Workflow Building** | Node-Based Editor | Drag-and-drop canvas with basic nodes (trigger, action, condition); supports JSON data piping. | Core to user experience; enables workflow creation. |
| **AI Integration** |  AI Node |  LLM node (OpenRouter integration for LLMs) for simple text generation or decision-making. | Showcases AI potential without complexity. |
| **Integrations** | 5 Core Connectors | Pre-built nodes for popular apps (e.g., Slack, Email, HTTP). | Validates integration capability with minimal scope. |
| **Debugging** | Basic Debugging | Inline logs and step re-run for workflows. | Ensures usability for developers. |
| **Security** | Basic Security | Encrypted credentials; simple user auth (JWT). | Minimum for safe self-hosting. |
| **Deployment** | Self-Hosting | Docker Compose setup for local deployment. | Core to open-source appeal. |

**Out of Scope for MVP**:
- Advanced AI (multi-step agents, tool-calling).
- Enterprise features (RBAC, SSO, audit logs).
- Extensive integrations (500+ reduced to 5).
- Advanced UI (mobile-responsive, i18n).
- Scalability features (workflow history, log streaming).

---

## 2. Technical Architecture
- **Backend**: Node.js/TypeScript with Express for simplicity 
- **Frontend**: React 18 with React Flow for canvas; minimal Tailwind CSS, shadcn.
- **Database**: SQLite (lightweight for MVP; PostgreSQL deferred).
- **AI Layer**: via Provider OpenRouter for LLM integration and local Ollama
- **Deployment**: Docker Compose for self-hosting.
- **Testing**: vitest for unit tests (70% coverage target).
- **Amp CLI Setup**: Agents defined in `AGENTS.md` (Workflow Core, Integration, Frontend, Security, Testing) used for code generation and iteration.

---

## 3. Implementation Phases
### Phase 1: Setup & Core Engine 
- **Goal**: Bootstrap project and build workflow engine.
- **Tasks**:
  - Initialize repo with `amp init` and configure agents (Workflow Core, Frontend).
  - Use Workflow Core Agent to generate:
    - `src/core/executor.ts`: Basic workflow engine (trigger → action → condition).
    - JSON schema for workflows (e.g., `{ nodes: [], edges: [] }`).
  - Use Frontend Agent to scaffold:
    - `src/frontend/components/WorkflowCanvas.tsx`: React Flow canvas with 3 node types (trigger, action, condition).
  - Set up SQLite for workflow storage.
  - CLI Commands:
    - `amp run workflow-core --task "Build a minimal workflow executor for JSON-based node graphs."`
    - `amp run frontend --task "Create React Flow canvas with drag-and-drop for 3 node types."`
- **Deliverables**: Runnable backend with basic canvas UI; sample workflow (e.g., HTTP trigger → log action).
- **Validation**: Run a test workflow locally (e.g., HTTP request triggers console log).

### Phase 2: Integrations & AI Node 
- **Goal**: Add 5 app connectors and a basic AI node.
- **Tasks**:
  - Use Integration Agent to generate nodes for:
    - Slack (post message), Email (SMTP send), HTTP (GET/POST), Google Sheets, Twitter/X .
    - Credential encryption with `crypto` module.
  - Use AI Agent Builder to create:
    - `src/ai/grok-node.ts`: Simple Grok API call for text generation (e.g., summarize input).
  - Integrate nodes into canvas (Frontend Agent updates `WorkflowCanvas.tsx`).
  - CLI Commands:
    - `amp run integrations --task "Generate 10 integration nodes with encrypted credentials."`
    - `amp run ai-builder --task "Create a Grok node for basic text generation."`
- **Deliverables**: 5 working integration nodes; AI node for text output.
- **Validation**: Test workflow (e.g., HTTP trigger → Grok summarize → Slack post).

### Phase 3: Debugging & Security 
- **Goal**: Add debugging tools and basic security.
- **Tasks**:
  - Use Testing Agent to:
    - Implement inline logs in `executor.ts` (e.g., node input/output).
    - Add step re-run functionality in canvas.
    - Write Jest tests for executor and 3 integration nodes.
  - Use Security Agent to:
    - Add JWT-based user auth (`src/auth/jwt.middleware.ts`).
    - Encrypt credentials in SQLite (`src/security/credential-store.ts`).
  - CLI Commands:
    - `amp run testing --task "Add inline logs and vitest tests for executor."`
    - `amp run security --task "Implement JWT auth and credential encryption."`
- **Deliverables**: Debuggable workflows; secure credential storage.
- **Validation**: Debug a workflow with logs; test auth with 2 users.

### Phase 4: Deployment & Polish 
- **Goal**: Package for self-hosting and prepare for assessment.
- **Tasks**:
  - Use Security Agent to generate:
    - `docker-compose.yml` for backend, frontend, and SQLite.
    - Basic setup docs in `README.md`.
  - Use Frontend Agent to polish UI (basic styling, error handling).
  - Use Testing Agent to ensure 70% test coverage.
  - Finalize Amp threads for code reviews (`amp share` for PRs).
  - CLI Commands:
    - `amp run security --task "Generate Docker Compose for self-hosting."`
    - `amp run frontend --task "Polish canvas UI with error messages."`
- **Deliverables**: Dockerized app; setup guide; demo video.
- **Validation**: Deploy locally; run 3 sample workflows (e.g., HTTP → Grok → Slack).

---

## 4. Resources & Dependencies
- **Tools**:
  - Amp CLI (ampcode.com) for agentic development.
  - Node.js 20+, Docker 24+, VS Code.
- **Dependencies**:
  - Backend: Express, sqlite3, crypto.
  - Frontend: React 18, React Flow, Tailwind CSS, Shadcn
  - AI: OpenRouter as provider (see example at https://openrouter.ai/docs/quickstart)
  - Testing: vitest.
- **Team**:
  - 1 Backend Dev: Oversees Workflow Core, Integration, Security Agents.
  - 1 Frontend Dev: Manages Frontend Agent, UI polish.
  - 1 DevOps/Testing: Handles Testing Agent, deployment.

---

## 5. Success Metrics
- **Functional**:
  - Create and run a workflow with 3 nodes (trigger, AI, action) in <5 minutes.
  - Deploy via Docker Compose in <10 minutes.
  - 10 integrations work without errors (e.g., Slack post succeeds).
- **Technical**:
  - 70% test coverage.
  - <500ms node execution latency (local).
  - No critical security issues (e.g., unencrypted credentials).
- **User Feedback**:
  - Demo to 5 technical teams/indie devs; collect feedback on usability.
  - Target: 80% report “easy to use” for basic workflows.

---

## 6. Risks & Mitigation
| Risk | Impact | Mitigation |
|------|--------|------------|
| Amp CLI agent errors | Delays in code generation | Manual review of Amp outputs; fallback to hand-coding critical modules. |
| Grok API rate limits | Slow AI node testing | Cache API responses; use mock data for dev. |
| Scope creep | Missed timeline | Strict adherence to MVP scope; defer extras to v1.1. |
| UI complexity | Poor user experience | Simplify canvas to 3 node types; reuse React Flow defaults. |

---

## 7. Post-MVP Steps
- **Assessment**: Demo to stakeholders , gather feedback on GitHub Issues.
- **Next Features**: Add 50+ integrations, RBAC, multi-step AI agents (Q1 2026).
- **Scaling**: Upgrade to PostgreSQL, add BullMQ for queuing.

For agent details, see **AGENTS.md**. 

