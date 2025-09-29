# FlowForge MVP

A self-hosted, node-based AI workflow automation platform inspired by n8n.io.

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- pnpm

### Setup

1. **Install dependencies**
   ```bash
   pnpm install
   ```

2. **Initialize database**
   ```bash
   cd packages/server && pnpm db:push
   ```

3. **Start development servers**
   ```bash
   # Terminal 1: Start backend (port 3001)
   cd packages/server && pnpm dev
   
   # Terminal 2: Start frontend (port 3000)
   cd packages/client && pnpm dev
   ```

4. **Access the application**
   - Frontend: http://localhost:3000
   - API: http://localhost:3001/api/health

## 🧩 Available Nodes

### Core Nodes
- **Trigger**: Starts workflow execution
- **Action**: Performs basic actions (log, transform)
- **Condition**: Branch logic based on conditions

### Integration Nodes
- **HTTP**: Make GET/POST requests to any API
- **AI**: OpenRouter integration for text generation
- **Slack**: Send messages via webhook or API
- **Email**: Send emails via SMTP
- **Sheets**: Google Sheets read/write operations

## 📝 Creating Your First Workflow

1. Drag nodes from the palette onto the canvas
2. Connect nodes by dragging from output handles to input handles
3. Configure node properties (coming soon - node editor)
4. Save workflow via API call
5. Execute workflow via API call

## 🔌 API Endpoints

### Workflows
- `GET /api/workflows` - List all workflows
- `POST /api/workflows` - Create workflow
- `PUT /api/workflows/:id` - Update workflow
- `POST /api/workflows/:id/execute` - Execute workflow

### Credentials (encrypted storage)
- `GET /api/credentials` - List credentials
- `POST /api/credentials` - Save credential
- `DELETE /api/credentials/:id` - Delete credential

### Executions
- `GET /api/executions` - List execution history

## 🧪 Testing Examples

### Quick Test Scripts

Run the README examples with pre-built curl scripts:

```bash
# Test Example 1: Basic HTTP workflow
./scripts/test-example1.sh

# Test Example 2: AI pipeline workflow  
./scripts/test-example2.sh

# Run both examples
./scripts/test-all-examples.sh
```

**Requirements**: 
- FlowForge server running on localhost:3001
- Optional: `jq` for formatted JSON output
- Optional: Environment variables for AI/Slack integration

### Example 1: Basic HTTP → Log Workflow
```json
{
  "name": "HTTP Test",
  "nodes": [
    {
      "id": "1",
      "type": "http",
      "data": {
        "config": {
          "method": "GET",
          "url": "https://jsonplaceholder.typicode.com/posts/1"
        }
      }
    }
  ],
  "edges": []
}
```

### Example 2: HTTP → AI → Slack Pipeline
```json
{
  "name": "AI Summary to Slack",
  "nodes": [
    {
      "id": "1",
      "type": "http",
      "data": {
        "config": {
          "method": "GET", 
          "url": "https://jsonplaceholder.typicode.com/posts/1"
        }
      }
    },
    {
      "id": "2",
      "type": "ai",
      "data": {
        "config": {
          "prompt": "Summarize this post: ${1.data.title} - ${1.data.body}",
          "apiKey": "your-openrouter-key"
        }
      }
    },
    {
      "id": "3",
      "type": "slack",
      "data": {
        "config": {
          "webhookUrl": "your-slack-webhook",
          "message": "AI Summary: ${2.response}"
        }
      }
    }
  ],
  "edges": [
    {"id": "e1", "source": "1", "target": "2"},
    {"id": "e2", "source": "2", "target": "3"}
  ]
}
```

## 🔐 Environment Variables

Create `.env` file in `packages/server/`:
```env
# Database
DATABASE_URL="file:./flowforge.db"

# Encryption
ENCRYPTION_KEY="your-32-character-secret-key"

# AI Integration
OPENROUTER_API_KEY="your-openrouter-key"

# Email (optional)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-password"

# Google Sheets (optional)
GOOGLE_SHEETS_API_KEY="your-sheets-api-key"
```

## 🏗️ Development Status

### ✅ Phase 1: Core Engine (Complete)
- Monorepo setup with pnpm workspaces
- Workflow executor with JSON schema
- React Flow canvas with drag-and-drop
- Prisma + SQLite database
- Express API server

### ✅ Phase 2: Integrations (Complete)  
- HTTP node (GET/POST requests)
- AI node (OpenRouter integration)
- Slack node (webhook/API)
- Email node (SMTP)
- Google Sheets node
- Credential encryption system

### 🚧 Phase 3: Debugging & Security (Todo)
- Inline logging in executor
- Step re-run functionality
- JWT authentication
- Unit tests (70% coverage)

### 🚧 Phase 4: Deployment (Todo)
- Docker Compose configuration
- UI polish and error handling
- Final validation and testing

## 🤝 Contributing

This is an MVP built using the `amp` CLI from Ampcode for rapid development assessment. The codebase follows the agent-based development patterns outlined in `AGENTS.md`.

## 📊 Success Metrics
- ✅ Create workflow with 5+ node types
- ✅ JSON-based execution engine  
- ✅ Integration with external APIs
- ⏳ <5 minute workflow creation
- ⏳ Docker deployment
