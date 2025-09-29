#!/bin/bash

# FlowForge Example 1: HTTP Test Workflow
# This script creates and executes the basic HTTP workflow from README.md

set -e  # Exit on any error

API_BASE="http://localhost:3001/api"
WORKFLOW_NAME="HTTP Test Example"

echo "🚀 FlowForge Example 1: HTTP Test Workflow"
echo "==========================================="

# Check if server is running
echo "📡 Checking server health..."
if ! curl -f -s "${API_BASE}/health" > /dev/null; then
    echo "❌ Error: FlowForge server not running on localhost:3001"
    echo "   Please start the server with: cd packages/server && pnpm dev"
    exit 1
fi

echo "✅ Server is running"

# Create the workflow
echo "📝 Creating HTTP Test workflow..."
WORKFLOW_JSON='{
  "name": "'"${WORKFLOW_NAME}"'",
  "description": "Basic HTTP request workflow from README Example 1",
  "nodes": [
    {
      "id": "trigger-1",
      "type": "trigger",
      "position": {"x": 100, "y": 100},
      "data": {
        "label": "Start Trigger",
        "config": {
          "triggerType": "manual"
        }
      }
    },
    {
      "id": "http-1", 
      "type": "action",
      "position": {"x": 300, "y": 100},
      "data": {
        "label": "HTTP Request",
        "config": {
          "actionType": "http",
          "method": "GET",
          "url": "https://jsonplaceholder.typicode.com/posts/1"
        }
      }
    }
  ],
  "edges": [
    {
      "id": "e1",
      "source": "trigger-1",
      "target": "http-1"
    }
  ]
}'

# Create workflow and capture the response
RESPONSE=$(curl -s -X POST "${API_BASE}/workflows" \
  -H "Content-Type: application/json" \
  -d "${WORKFLOW_JSON}")

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
  -d '{"inputData": {"message": "Testing HTTP workflow"}}')

echo "📊 Execution Results:"
echo "===================="
echo "$EXECUTION_RESPONSE" | jq '.' 2>/dev/null || echo "$EXECUTION_RESPONSE"

# Get execution history
echo ""
echo "📋 Recent Executions:"
echo "===================="
curl -s "${API_BASE}/executions?workflowId=${WORKFLOW_ID}" | jq '.executions[] | {id, status, createdAt}' 2>/dev/null || echo "Failed to fetch executions"

echo ""
echo "🎉 Example 1 workflow test completed!"
echo ""
echo "💡 What happened:"
echo "   1. Created a workflow with HTTP request node"
echo "   2. Executed the workflow"  
echo "   3. The workflow made a GET request to JSONPlaceholder API"
echo "   4. Results logged and stored in database"
echo ""
echo "🔧 Next steps:"
echo "   - View workflow in UI: http://localhost:3000"
echo "   - Check all workflows: curl ${API_BASE}/workflows"
echo "   - Delete workflow: curl -X DELETE ${API_BASE}/workflows/${WORKFLOW_ID}"
