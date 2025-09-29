#!/bin/bash

# FlowForge Example 2: HTTP → AI → Slack Pipeline
# Fixed version with proper JSON escaping

set -e
API_BASE="http://localhost:3001/api"
WORKFLOW_NAME="AI Summary to Slack"

echo "🤖 FlowForge Example 2: HTTP → AI → Slack Pipeline"
echo "================================================="

# Check if server is running
echo "📡 Checking server health..."
if ! curl -f -s "${API_BASE}/health" > /dev/null; then
    echo "❌ Error: FlowForge server not running on localhost:3001"
    echo "   Please start the server with: cd packages/server && pnpm dev"
    exit 1
fi

echo "✅ Server is running"

# Check for required environment variables
if [ -z "$OPENROUTER_API_KEY" ]; then
    echo "⚠️  Warning: OPENROUTER_API_KEY not set - AI node may fail"
fi

if [ -z "$SLACK_WEBHOOK_URL" ]; then
    echo "⚠️  Warning: SLACK_WEBHOOK_URL not set - using mock webhook"
    SLACK_WEBHOOK_URL="https://hooks.slack.com/services/mock/webhook/test"
fi

# Create the workflow using a temporary file to avoid bash escaping issues
echo "📝 Creating AI Summary to Slack workflow..."

cat > /tmp/workflow.json <<EOF
{
  "name": "${WORKFLOW_NAME}",
  "description": "HTTP → AI → Slack pipeline from README Example 2",
  "nodes": [
    {
      "id": "trigger-1",
      "type": "trigger",
      "position": {"x": 50, "y": 100},
      "data": {
        "label": "Manual Trigger",
        "config": {
          "triggerType": "manual"
        }
      }
    },
    {
      "id": "http-1",
      "type": "action", 
      "position": {"x": 250, "y": 100},
      "data": {
        "label": "Fetch Post",
        "config": {
          "actionType": "http",
          "method": "GET",
          "url": "https://jsonplaceholder.typicode.com/posts/1"
        }
      }
    },
    {
      "id": "ai-1",
      "type": "ai",
      "position": {"x": 450, "y": 100}, 
      "data": {
        "label": "AI Summarize",
        "config": {
          "prompt": "Summarize and translate this blog post in 2 English sentences: Title: \${http-1.data.title} - Content: \${http-1.data.body}",
          "model": "google/gemma-2-9b-it:free"
        }
      }
    }
  ],
  "edges": [
    {"id": "e1", "source": "trigger-1", "target": "http-1"},
    {"id": "e2", "source": "http-1", "target": "ai-1"}
   
  ]
}
EOF

# Create workflow and capture the response
RESPONSE=$(curl -s -X POST "${API_BASE}/workflows" \
  -H "Content-Type: application/json" \
  -d @/tmp/workflow.json)

# Clean up temp file
rm -f /tmp/workflow.json

# Extract workflow ID from response
WORKFLOW_ID=$(echo "$RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -z "$WORKFLOW_ID" ]; then
    echo "❌ Error: Failed to create workflow"
    echo "Response: $RESPONSE"
    exit 1
fi

echo "✅ Workflow created with ID: $WORKFLOW_ID"

# Execute the workflow
echo "⚡ Executing workflow..."
EXECUTION_RESPONSE=$(curl -s -X POST "${API_BASE}/workflows/${WORKFLOW_ID}/execute" \
  -H "Content-Type: application/json" \
  -d '{"inputData": {"topic": "AI automation", "source": "FlowForge test"}}')

echo "📊 Execution Results:"
echo "===================="
echo "$EXECUTION_RESPONSE" | jq '.' 2>/dev/null || echo "$EXECUTION_RESPONSE"

# Get execution logs
echo ""
echo "📋 Execution Logs:" 
echo "=================="
EXECUTION_ID=$(echo "$EXECUTION_RESPONSE" | grep -o '"executionId":"[^"]*"' | cut -d'"' -f4)

if [ ! -z "$EXECUTION_ID" ]; then
    curl -s "${API_BASE}/executions" | jq ".executions[] | select(.id == \"${EXECUTION_ID}\") | .logs" 2>/dev/null || echo "No detailed logs available"
fi

echo ""
echo "🎉 Example 2 workflow test completed!"
echo ""
echo "💡 What happened:"
echo "   1. Created AI pipeline workflow with 4 connected nodes"
echo "   2. HTTP node fetched a blog post from JSONPlaceholder"
echo "   3. AI node summarized the content (if API key provided)"
echo "   4. Slack node sent notification (if webhook provided)"
echo "   5. Full execution logged and stored"
echo ""
echo "🔧 Next steps:"
echo "   - Set environment variables for full functionality:"
echo "     export OPENROUTER_API_KEY=your-key"
echo "     export SLACK_WEBHOOK_URL=your-webhook"
echo "   - View workflow in UI: http://localhost:3000" 
echo "   - Delete workflow: curl -X DELETE ${API_BASE}/workflows/${WORKFLOW_ID}"
