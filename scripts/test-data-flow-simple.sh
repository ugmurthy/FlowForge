#!/bin/bash

# Simple test to verify HTTP → Action data flow without external APIs

set -e
API_BASE="http://localhost:3001/api"

echo "🔄 Testing Data Flow: HTTP → Log Action"
echo "======================================="

# Simple workflow to test data piping without external APIs
cat > /tmp/workflow.json <<EOF
{
  "name": "Data Flow Test - HTTP to Log",
  "description": "Test HTTP to Log action data piping",
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
      "id": "log-1",
      "type": "action",
      "position": {"x": 500, "y": 100},
      "data": {
        "label": "Log HTTP Response",
        "config": {
          "actionType": "log",
          "message": "Received HTTP data - Title: \${http-1.data.title}, Status: \${http-1.statusCode}"
        }
      }
    }
  ],
  "edges": [
    {"id": "e1", "source": "trigger-1", "target": "http-1"},
    {"id": "e2", "source": "http-1", "target": "log-1"}
  ]
}
EOF

# Create and execute workflow
echo "Creating workflow..."
RESPONSE=$(curl -s -X POST "${API_BASE}/workflows" \
  -H "Content-Type: application/json" \
  -d @/tmp/workflow.json)

# Clean up temp file
rm -f /tmp/workflow.json

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
echo "🔍 Check server logs to see if the log action shows the HTTP response data!"
echo "   Look for: 'Action executed: Received HTTP data - Title: ...'"
echo ""
echo "🧹 Clean up: curl -X DELETE ${API_BASE}/workflows/${WORKFLOW_ID}"
