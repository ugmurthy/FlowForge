#!/bin/bash

# Script to create and execute a workflow with parallel HTTP nodes converging to Google Sheets
# Workflow: TRIGGER -> 3 parallel HTTP nodes (fetch users 7,6,8) -> Google Sheets action

set -e

API_BASE_URL="${API_BASE_URL:-http://localhost:3001}"

echo "Creating workflow with parallel HTTP nodes..."

# Create workflow JSON
WORKFLOW_JSON=$(cat <<EOF
{
  "name": "Parallel User Fetch to Sheets",
  "description": "Fetch 3 users in parallel and write to Google Sheets",
  "nodes": [
    {
      "id": "trigger-1",
      "type": "trigger",
      "position": { "x": 100, "y": 200 },
      "data": {
        "label": "Manual Trigger",
        "config": {
          "triggerType": "manual"
        }
      }
    },
    {
      "id": "http-user7",
      "type": "action",
      "position": { "x": 300, "y": 100 },
      "data": {
        "label": "Fetch User 7",
        "config": {
          "actionType": "http",
          "method": "GET",
          "url": "https://jsonplaceholder.typicode.com/users/7"
        }
      }
    },
    {
      "id": "http-user6",
      "type": "action",
      "position": { "x": 300, "y": 200 },
      "data": {
        "label": "Fetch User 6",
        "config": {
          "actionType": "http",
          "method": "GET",
          "url": "https://jsonplaceholder.typicode.com/users/6"
        }
      }
    },
    {
      "id": "http-user8",
      "type": "action",
      "position": { "x": 300, "y": 300 },
      "data": {
        "label": "Fetch User 8",
        "config": {
          "actionType": "http",
          "method": "GET",
          "url": "https://jsonplaceholder.typicode.com/users/8"
        }
      }
    },
    {
      "id": "sheets-1",
      "type": "action",
      "position": { "x": 500, "y": 200 },
      "data": {
        "label": "Write to Google Sheets",
        "config": {
          "actionType": "sheets",
          "operation": "append",
          "spreadsheetId": "1LYPfl2VaQZjI3WvTYJLH6CvKOkxWxMr0vTT8vhyAzEk",
          "range": "Sheet1!A:Z"
        }
      }
    }
  ],
  "edges": [
    {
      "id": "e-trigger-http7",
      "source": "trigger-1",
      "target": "http-user7"
    },
    {
      "id": "e-trigger-http6",
      "source": "trigger-1",
      "target": "http-user6"
    },
    {
      "id": "e-trigger-http8",
      "source": "trigger-1",
      "target": "http-user8"
    },
    {
      "id": "e-http7-sheets",
      "source": "http-user7",
      "target": "sheets-1"
    },
    {
      "id": "e-http6-sheets",
      "source": "http-user6",
      "target": "sheets-1"
    },
    {
      "id": "e-http8-sheets",
      "source": "http-user8",
      "target": "sheets-1"
    }
  ]
}
EOF
)

# Create the workflow
echo "Sending workflow creation request..."
RESPONSE=$(curl -s -X POST "$API_BASE_URL/api/workflows" \
  -H "Content-Type: application/json" \
  -d "$WORKFLOW_JSON")

echo "Response: $RESPONSE"

# Extract workflow ID
WORKFLOW_ID=$(echo "$RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | sed 's/"id":"\(.*\)"/\1/')

if [ -z "$WORKFLOW_ID" ]; then
  echo "Error: Failed to create workflow"
  exit 1
fi

echo "Workflow created with ID: $WORKFLOW_ID"

# Execute the workflow
echo "Executing workflow..."
EXEC_RESPONSE=$(curl -s -X POST "$API_BASE_URL/api/workflows/$WORKFLOW_ID/execute" \
  -H "Content-Type: application/json" \
  -d '{}')

echo "Execution response: $EXEC_RESPONSE"

# Extract execution ID
EXECUTION_ID=$(echo "$EXEC_RESPONSE" | grep -o '"executionId":"[^"]*"' | head -1 | sed 's/"executionId":"\(.*\)"/\1/')

if [ -z "$EXECUTION_ID" ]; then
  EXECUTION_ID=$(echo "$EXEC_RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | sed 's/"id":"\(.*\)"/\1/')
fi

echo "Execution ID: $EXECUTION_ID"
echo "Done! Workflow created and executed."
echo ""
echo "View workflow: $API_BASE_URL/api/workflows/$WORKFLOW_ID"
