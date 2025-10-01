#!/bin/bash

# Quick test to verify data flow between HTTP and AI nodes

set -e
API_BASE="http://localhost:3001/api"

echo "🔄 Testing Data Flow: HTTP → AI"
echo "================================"

# Simple workflow to test data piping
WORKFLOW_JSON='{
  "name": "Data Flow Test",
  "description": "Test HTTP to AI data piping",
  "nodes": [
    {
      "id": "trigger-1",
      "type": "trigger", 
      "position": {"x": 100, "y": 100},
      "data": {
        "label": "Manual Trigger",
        "config": {"triggerType": "manual"}
      }
    },
    {
      "id": "http-1",
      "type": "action",
      "position": {"x": 300, "y": 100},
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
      "position": {"x": 500, "y": 100},
      "data": {
        "label": "Process Data",
        "config": {
          "prompt": "Data received - Title: ${http-1.data.title}, Body: ${http-1.data.body}. Please confirm you received this data.",
          "model": "WRONG:x-ai/grok-4-fast:free"
        }
      }
    }
  ],
  "edges": [
    {"id": "e1", "source": "trigger-1", "target": "http-1"},
    {"id": "e2", "source": "http-1", "target": "ai-1"}
  ]
}'

# Create and execute workflow
echo "Creating workflow..."
RESPONSE=$(curl -s -X POST "${API_BASE}/workflows" \
  -H "Content-Type: application/json" \
  -d "${WORKFLOW_JSON}")

WORKFLOW_ID=$(echo "$RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -z "$WORKFLOW_ID" ]; then
    echo "❌ Failed to create workflow"
    echo "$RESPONSE"
    exit 1
fi

echo "✅ Workflow created: $WORKFLOW_ID"

echo "Executing workflow..."
EXECUTION_RESPONSE=$(curl -s -X POST "${API_BASE}/workflows/${WORKFLOW_ID}/execute" \
  -H "Content-Type: application/json" \
  -d '{}')

echo "📊 Execution Response:"
echo "$EXECUTION_RESPONSE" | jq '.' 2>/dev/null || echo "$EXECUTION_RESPONSE"

echo ""
echo "🔍 Check server logs to see data flow debugging info!"
