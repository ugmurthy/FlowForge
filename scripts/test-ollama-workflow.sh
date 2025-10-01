#!/bin/bash

# FlowForge: Ollama Local Models Workflow
# This workflow lists all local Ollama models and gets detailed characteristics

set -e  # Exit on any error

API_BASE="http://localhost:3001/api"
OLLAMA_BASE="http://localhost:11434"
WORKFLOW_NAME="Ollama Model Inspector"

echo "🤖 FlowForge: Ollama Model Inspector Workflow"
echo "=============================================="

# Check if server is running
echo "📡 Checking FlowForge server..."
if ! curl -f -s "${API_BASE}/health" > /dev/null; then
    echo "❌ Error: FlowForge server not running on localhost:3001"
    echo "   Please start the server with: cd packages/server && pnpm dev"
    exit 1
fi
echo "✅ FlowForge server is running"

# Check if Ollama is running
echo "📡 Checking Ollama service..."
if ! curl -f -s "${OLLAMA_BASE}/api/tags" > /dev/null 2>&1; then
    echo "❌ Error: Ollama not running on localhost:11434"
    echo "   Please start Ollama with: ollama serve"
    exit 1
fi
echo "✅ Ollama service is running"

# Get list of models
echo "📋 Available Ollama models:"
curl -s "${OLLAMA_BASE}/api/tags" | jq -r '.models[]?.name // empty' | sed 's/^/   - /'

# Create the workflow
echo ""
echo "📝 Creating Ollama Model Inspector workflow..."
WORKFLOW_JSON='{
  "name": "'"${WORKFLOW_NAME}"'",
  "description": "Lists local Ollama models and gets their detailed characteristics using AI",
  "nodes": [
    {
      "id": "trigger-1",
      "type": "trigger",
      "position": {"x": 100, "y": 100},
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
      "position": {"x": 300, "y": 100},
      "data": {
        "label": "List Ollama Models",
        "config": {
          "actionType": "http",
          "method": "GET",
          "url": "http://localhost:11434/api/tags"
        }
      }
    },
    {
      "id": "ollama-1",
      "type": "ollama",
      "position": {"x": 500, "y": 100},
      "data": {
        "label": "Analyze Models",
        "config": {
          "model": "gpt-oss:20b",
          "systemPrompt": "You are an AI model expert. Analyze the provided list of Ollama models and describe their characteristics, use cases, and capabilities.",
          "prompt": "Here is the JSON list of locally installed Ollama models:\n\n${http-1.data.models}\n\nFor each model, provide: 1) Model type/family, 2) Best use cases, 3) Key capabilities, 4) Approximate size/parameters. Format as a clear, structured summary.",
          "temperature": 0.7
        }
      }
    }
  ],
  "edges": [
    {
      "id": "e1",
      "source": "trigger-1",
      "target": "http-1"
    },
    {
      "id": "e2",
      "source": "http-1",
      "target": "ollama-1"
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
echo ""
echo "⚡ Executing workflow..."
EXECUTION_RESPONSE=$(curl -s -X POST "${API_BASE}/workflows/${WORKFLOW_ID}/execute" \
  -H "Content-Type: application/json" \
  -d '{"inputData": {"source": "Ollama Model Inspector"}}')

echo ""
echo "📊 Execution Results:"
echo "===================="
echo "$EXECUTION_RESPONSE" | jq '.' 2>/dev/null || echo "$EXECUTION_RESPONSE"

# Extract and display AI analysis
echo ""
echo "🤖 AI Model Analysis:"
echo "===================="
AI_RESPONSE=$(echo "$EXECUTION_RESPONSE" | jq -r '.context.data["ollama-1"].response // "No AI response available"')
echo "$AI_RESPONSE"

# Get execution history
echo ""
echo "📋 Recent Executions:"
echo "===================="
curl -s "${API_BASE}/executions?workflowId=${WORKFLOW_ID}" | jq '.executions[] | {id, status, createdAt}' 2>/dev/null || echo "Failed to fetch executions"

echo ""
echo "🎉 Ollama workflow test completed!"
echo ""
echo "💡 What happened:"
echo "   1. Triggered the workflow manually"
echo "   2. HTTP node called Ollama API to list installed models"
echo "   3. Ollama AI node analyzed the model list and provided detailed characteristics"
echo "   4. Results logged and stored in database"
echo ""
echo "🔧 Next steps:"
echo "   - View workflow in UI: http://localhost:3000"
echo "   - Check all workflows: curl ${API_BASE}/workflows"
echo "   - Delete workflow: curl -X DELETE ${API_BASE}/workflows/${WORKFLOW_ID}"
echo "   - Install more models: ollama pull <model-name>"
