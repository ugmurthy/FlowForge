# Viewing Existing Workflows in FlowForge

## Quick Start

1. **Start the development environment:**
   ```bash
   ./scripts/start-dev.sh
   ```
   This will start both the server (port 3001) and client (port 3000).

2. **Open your browser:**
   - Navigate to: http://localhost:3000
   - You'll see the FlowForge workflow canvas

## What You'll See

### Workflow Selector (Top Right)
- **Modern Card UI**: Clean card-based interface with professional styling
- **Current Workflow**: Shows the name of the currently loaded workflow
- **Dropdown**: Elegant select dropdown to switch between workflows
- **Save Button**: Modern button with save icon and visual feedback
- **Workflow ID**: Shows shortened workflow ID for reference

### Node Palette (Top Left)  
- **Card Interface**: Organized node palette in a clean card layout
- **Add Nodes**: Modern outline buttons to add nodes to canvas
- **Node Categories**: Core nodes (Trigger, Action, Condition) and Integration nodes
- **Available Types**: Trigger, Action, Condition, HTTP, AI, Slack, Email, Sheets

### Canvas
- **Visual Workflow**: Clean, professional workflow representation
- **Modern Node Design**: Color-coded nodes with Tailwind CSS styling:
  - 🔵 **Trigger**: Blue theme for workflow entry points
  - 🟢 **Action**: Green theme for general actions
  - 🟠 **Condition**: Orange theme for decision logic
  - 🟣 **AI**: Purple theme for AI/ML nodes
  - 🔵 **HTTP**: Indigo theme for HTTP requests
  - 🟡 **Slack**: Teal theme for Slack integration
  - 🔴 **Email**: Rose theme for email actions
  - 🟢 **Sheets**: Emerald theme for Google Sheets
- **Interactive**: Drag nodes around, create connections
- **Professional UI**: Consistent styling with shadcn/ui components

## Existing Workflows

If you've run the test scripts, you should see workflows like:
- **"AI Summary to Slack"** - HTTP → AI → Slack pipeline
- **"HTTP Test"** - Basic HTTP request workflow  
- **"Data Flow Test"** - HTTP → Log pipeline

## Features

✅ **Load workflows** from database automatically  
✅ **Switch between workflows** using dropdown  
✅ **Visual node representation** with proper types  
✅ **Save workflow changes** back to database  
✅ **Add new nodes** from palette  
✅ **Create connections** by dragging between handles  

## Troubleshooting

**No workflows showing?**
- Run `./scripts/test-example1.sh` to create a test workflow
- Check server is running: `curl http://localhost:3001/api/health`

**Client won't start?**
- Make sure dependencies are installed: `pnpm install`
- Check if port 3000 is available

**Changes not saving?**
- Make sure server is running on port 3001
- Check browser console for API errors

## API Endpoints

You can also view workflows via API:
```bash
# List all workflows
curl http://localhost:3001/api/workflows | jq .

# Get specific workflow
curl http://localhost:3001/api/workflows/WORKFLOW_ID | jq .

# View executions
curl http://localhost:3001/api/executions | jq .
```

## Next Steps

1. **View existing workflows** created by test scripts
2. **Edit workflows** by dragging nodes and creating connections  
3. **Save changes** using the save button
4. **Create new workflows** by adding nodes from the palette
5. **Test workflows** using the execution scripts

Happy workflow building! 🎉
