## Product Overview

**Product Name**: FlowForge (working title)  
**Tagline**: A self-hosted, node-based AI workflow automation platform for technical teams—build, automate, and scale like n8n, powered by Ampcode agents.  
**Version**: 1.0 (MVP)  
**Current Date**: September 29, 2025  
**Description**: FlowForge is an open-source-inspired tool for creating multi-step AI agents and integrating 500+ apps via drag-and-drop or code. It emphasizes flexibility, self-hosting (including AI models), and enterprise security, targeting developers, IT ops, and automation enthusiasts. Built using Amp CLI for agentic development.

## Target Audience
- **Primary**: Technical teams in mid-to-large enterprises (e.g., Delivery Hero-style ops).
- **Secondary**: Indie developers and SMBs seeking affordable, customizable automation.
- **Pain Points Addressed**: Limited control in cloud-only tools (e.g., Zapier); need for code-level tweaks without vendor lock-in.

## Core Features
| Category | Feature | Description | Priority |
|----------|---------|-------------|----------|
| **Workflow Building** | Node-Based Editor | Drag-and-drop canvas for nodes (triggers, actions, conditions); supports JS/Python code nodes. | High |
| **Workflow Building** | Templates & Library | 1700+ starter templates; npm/PyPI library integration. | Medium |
| **AI Integration** | Multi-Step Agents | LLM chaining (Grok/OpenAI) with tool-calling; embed chat UIs (Slack/Teams/SMS). | High |
| **AI Integration** | Self-Hosted Models | Deploy LLMs on-prem via Docker; no external API dependency. | High |
| **Integrations** | App Connectors | 500+ pre-built (Salesforce, Zoom, etc.); custom cURL/HTTP nodes. | High |
| **Integrations** | Credential Management | Encrypted stores with rotation; OAuth support. | Medium |
| **Debugging & Dev** | Rapid Iteration | Re-run steps, mock data, inline logs; branch merging. | High |
| **Debugging & Dev** | Collaboration | Git control, multi-user editing, isolated envs. | Medium |
| **Security** | Data Privacy | Encrypted secrets, external storage hooks. | High |
| **Deployment** | Hosting Options | Self-host (Docker/K8s) or managed cloud; white-label for customers. | High |
| **Deployment** | Scalability | Workflow history, log streaming, queueing (BullMQ). | Medium |
| **UI/UX** | Interfaces | Web app with React flow ; mobile-responsive; voice/SMS triggers. | Medium |

## Technical Specifications

### Architecture
- **Backend**: Node.js/TypeScript with NestJS for modularity; Rete.js for workflow graphs.
- **Frontend**: React 18+ with React Flow for canvas; Tailwind CSS for styling.
- **Database**: PostgreSQL for workflows/secrets; Redis for queuing/state.
- **AI Layer**: LangChain.js for agent orchestration; supports local models (e.g., via Ollama).
- **Deployment**: Docker Compose for local; Helm charts for K8s; CI/CD via GitHub Actions.
- **APIs**: REST/GraphQL for integrations; WebSockets for real-time execution.
- **Performance**: Handles 1000+ concurrent workflows; <500ms node latency (target).

### System Requirements
- **Server**: Node.js 20+, 4GB RAM min (8GB for AI hosting), Docker 24+.
- **Client**: Modern browser (Chrome 100+); optional VS Code for code nodes.
- **Dependencies**:
  - Core: Express, BullMQ, Crypto.
  - AI: OpenAI SDK or local equiv.
  - Testing: vitest
  - Styling: Shadcn, Tailwind

- **Self-Hosting**: Full source on GitHub; air-gapped compatible (no npm fetch post-build).

### Integrations
- **Built-in**: 10+ nodes (e.g., HTTP, Email, Google Drive).
- **Extensibility**: Custom nodes via JS/TS; community registry planned.
- **AI Models**: via provide OpenRouter,  Ollama (local).

## Non-Functional Requirements
- **Security**: OWASP Top 10 compliant; SOC 2 ready.
- **Accessibility**: WCAG 2.1 AA; keyboard-navigable canvas.
- **Internationalization**: English default; i18n hooks for 5+ languages.
- **Monitoring**: simplest solution for metrics.


## Roadmap
- **MVP (Q4 2025)**: Core engine, 5 integrations, basic AI nodes.
- **v1.1 (Q1 2026)**: Full self-hosting, enterprise security.
- **Future**: Mobile app, advanced analytics.

## Comparison to n8n
| Aspect | FlowForge | n8n |
|--------|-----------|-----|
| **Hosting** | Self-host + Cloud | Self-host + Cloud |
| **AI Focus** | Built-in multi-agent (Amp-powered) | Strong AI workflows |
| **Code/UI** | Hybrid (code-first via agents) | Hybrid |
| **Integrations** | 10+ (expandable via Amp) | 10+ |
| **Unique** | Agentic dev with Amp CLI | Open-source emphasis |


