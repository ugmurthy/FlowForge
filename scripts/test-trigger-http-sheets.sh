#!/bin/bash

# Test workflow: Trigger → HTTP → Sheets
# Tests a complete data pipeline from trigger through HTTP fetch to sheets write

set -e
API_BASE="http://localhost:3001/api"

echo "🔄 Testing Workflow: Trigger → HTTP → Sheets"
echo "=============================================="

# Create workflow with trigger → HTTP → sheets pipeline
cat > /tmp/workflow-http-sheets.json <<EOF
{
  "name": "Trigger HTTP Sheets Pipeline",
  "description": "Test complete pipeline: trigger → HTTP fetch → write to sheets",
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
        "label": "Fetch User Data",
        "config": {
          "actionType": "http",
          "method": "GET",
          "url": "https://jsonplaceholder.typicode.com/users/2"
        }
      }
    },
    {
      "id": "sheets-1",
      "type": "action",
      "position": {"x": 500, "y": 100},
      "data": {
        "label": "Write to Sheets",
        "config": {
          "actionType": "sheets",
          "operation": "appendRow",
          "spreadsheetId": "1LYPfl2VaQZjI3WvTYJLH6CvKOkxWxMr0vTT8vhyAzEk",
          "sheetName": "UserData",
          "values": [
            "\${http-1.data.id}",
            "\${http-1.data.name}",
            "\${http-1.data.email}",
            "\${http-1.data.phone}"
          ]
        }
      }
    }
  ],
  "edges": [
    {"id": "e1", "source": "trigger-1", "target": "http-1"},
    {"id": "e2", "source": "http-1", "target": "sheets-1"}
  ]
}
EOF

echo "📝 Creating workflow..."
RESPONSE=$(curl -s -X POST "${API_BASE}/workflows" \
  -H "Content-Type: application/json" \
  -d @/tmp/workflow-http-sheets.json)

rm -f /tmp/workflow-http-sheets.json

WORKFLOW_ID=$(echo "$RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -z "$WORKFLOW_ID" ]; then
    echo "❌ Failed to create workflow"
    echo "$RESPONSE"
    exit 1
fi

echo "✅ Workflow created: $WORKFLOW_ID"

echo ""
echo "🚀 Executing workflow..."
EXECUTION_RESPONSE=$(curl -s -X POST "${API_BASE}/workflows/${WORKFLOW_ID}/execute" \
  -H "Content-Type: application/json" \
  -d '{}')

echo ""
echo "📊 Execution Response:"
echo "$EXECUTION_RESPONSE" | jq '.' 2>/dev/null || echo "$EXECUTION_RESPONSE"

echo ""
echo "✨ Expected Flow:"
echo "  1. Trigger initiates workflow"
echo "  2. HTTP node fetches user data from JSONPlaceholder API"
echo "  3. Sheets node receives HTTP output and appends row with:"
echo "     - User ID, Name, Email, Phone"
echo ""
echo "🔍 Check server logs to verify:"
echo "   - HTTP node received user data"
echo "   - Sheets node processed the data from HTTP output"
echo ""
echo "🧹 Clean up: curl -X DELETE ${API_BASE}/workflows/${WORKFLOW_ID}"
