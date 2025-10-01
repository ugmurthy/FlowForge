# Integration Guide for FlowForge

> **Comprehensive guide for creating custom integrations (nodes) in FlowForge's n8n-like workflow automation platform**

## Table of Contents
1. [Overview](#overview)
2. [Integration Anatomy](#integration-anatomy)
3. [Data Flow Architecture](#data-flow-architecture)
4. [Backend Implementation](#backend-implementation)
5. [Frontend Implementation](#frontend-implementation)
6. [Complete Working Example](#complete-working-example)
7. [Best Practices](#best-practices)
8. [Testing Integrations](#testing-integrations)

---

## Overview

FlowForge integrations are modular, executable nodes that perform specific tasks within a workflow. Each integration consists of two components:

- **Backend Executor** (Node.js/TypeScript): Handles the actual execution logic
- **Frontend Component** (React/JSX): Provides the visual UI in the workflow canvas

Integrations can access data from previous nodes in the workflow and pass their results to downstream nodes, enabling powerful data transformations and automation chains.

---

## Integration Anatomy

### Core Interfaces

All integrations must implement the `NodeExecutor` interface:

```typescript
// packages/server/src/types/workflow.ts
export interface NodeExecutor {
  execute(context: ExecutionContext, nodeData: WorkflowNode['data']): Promise<any>;
}
```

### Execution Context Structure

The `ExecutionContext` provides access to workflow data and logging:

```typescript
export interface ExecutionContext {
  workflowId: string;        // Unique workflow identifier
  executionId: string;        // Unique execution run identifier
  data: Record<string, any>;  // Data from all executed nodes (key = nodeId)
  logs: ExecutionLog[];       // Execution logs
}
```

### Node Data Structure

Each node has configuration and runtime data:

```typescript
export interface WorkflowNode {
  id: string;                 // Unique node ID (e.g., "http-1", "slack-2")
  type: string;               // Node type (e.g., "http", "slack", "ai")
  position: { x: number; y: number };
  data: {
    label: string;            // Display name
    config: Record<string, any>;  // Node configuration
    inputs?: Record<string, any>; // Optional input data
    outputs?: Record<string, any>; // Optional output data
  };
}
```

---

## Data Flow Architecture

### How Data Flows Between Nodes

```
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│   Trigger   │─────▶│  HTTP Node  │─────▶│ Slack Node  │
│   (node-1)  │      │  (node-2)   │      │  (node-3)   │
└─────────────┘      └─────────────┘      └─────────────┘
       │                    │                     │
       ▼                    ▼                     ▼
    context.data['node-1']  │              context.data['node-3']
                           │
                    context.data['node-2']
                    {
                      statusCode: 200,
                      data: { userId: 123, name: "John" }
                    }
```

### Accessing Source Node Data

Nodes access previous node data through `context.data[nodeId]`:

```typescript
import { getNestedValue } from '../utils/variable-utils.js';

// Direct access
const previousResult = context.data['node-2'];
const userId = previousResult.data.userId;

// Nested property access using shared utility
// Usage: getNestedValue(context.data, 'node-2.data.userId') -> 123
const userId = getNestedValue(context.data, 'node-2.data.userId');
```

### Variable Replacement Pattern

FlowForge uses `${variableName}` syntax for dynamic data injection:

```typescript
import { replaceVariables } from '../utils/variable-utils.js';

// User configuration
const message = "Hello ${node-2.data.name}! Your ID is ${node-2.data.userId}";

// Variable replacement using shared utility
const processedMessage = replaceVariables(message, context.data);

// Result: "Hello John! Your ID is 123"
```

### Passing Data to Destination Nodes

Nodes return data that gets stored in `context.data[nodeId]`:

```typescript
async execute(context: ExecutionContext, nodeData: any): Promise<any> {
  // ... perform operation ...
  
  // Return data (becomes available to downstream nodes)
  return {
    success: true,
    statusCode: 200,
    data: {
      userId: 123,
      name: "John",
      email: "john@example.com"
    },
    timestamp: new Date().toISOString()
  };
}
```

---

## Backend Implementation

### 1. Create Integration Executor

Create a new file in `packages/server/src/integrations/your-node.ts`:

```typescript
import axios from 'axios';
import { NodeExecutor, ExecutionContext } from '../types/workflow.js';
import { replaceVariables, getNestedValue } from '../utils/variable-utils.js';

export class YourNodeExecutor implements NodeExecutor {
  async execute(context: ExecutionContext, nodeData: any): Promise<any> {
    // Extract configuration
    const config = nodeData.config || {};
    const requiredParam = config.requiredParam || '';
    
    // Validation
    if (!requiredParam) {
      throw new Error('Your node requires a requiredParam');
    }
    
    // Variable replacement for dynamic values using shared utility
    const processedParam = replaceVariables(requiredParam, context.data);
    
    try {
      // Perform integration logic
      const result = await this.performOperation(processedParam);
      
      // Return structured data
      return {
        success: true,
        data: result,
        timestamp: new Date().toISOString()
      };
      
    } catch (error: any) {
      // Error handling
      throw new Error(`Operation failed: ${error.message}`);
    }
  }
  
  private async performOperation(param: string): Promise<any> {
    // Your integration logic here
    return { result: 'success' };
  }
}

export const yourNodeExecutor = new YourNodeExecutor();
```

### 2. Register Executor

Add your executor to `packages/server/src/core/executor.ts`:

```typescript
// Import at top
import { yourNodeExecutor } from '../integrations/your-node.js';

// In registerBuiltInExecutors() method
this.registerExecutor('yourNodeType', yourNodeExecutor);
```

---

## Frontend Implementation

### Create React Component

Create a new file in `packages/client/src/components/nodes/YourNode.jsx`:

```jsx
import React from 'react';
import { Handle, Position } from '@xyflow/react';

export default function YourNode({ data }) {
  return (
    <div className="p-3 rounded-lg bg-purple-50 border-2 border-purple-500 min-w-[150px] text-center">
      <div className="font-bold text-purple-700 text-xs uppercase tracking-wide">
        YOUR INTEGRATION
      </div>
      <div className="mt-1 text-sm text-gray-800">
        {data.label}
      </div>
      
      {/* Input handle (left side) */}
      <Handle
        type="target"
        position={Position.Left}
        className="!bg-purple-500"
      />
      
      {/* Output handle (right side) */}
      <Handle
        type="source"
        position={Position.Right}
        className="!bg-purple-500"
      />
    </div>
  );
}
```

### Register Component

Add your component to the node registry (typically in a node factory or canvas component).

---

## Complete Working Example

### Example: HTTP Integration Node

#### Backend Executor

```typescript
// packages/server/src/integrations/http-node.ts
import axios from 'axios';
import { NodeExecutor, ExecutionContext } from '../types/workflow.js';

export class HttpNodeExecutor implements NodeExecutor {
  async execute(context: ExecutionContext, nodeData: any): Promise<any> {
    // Extract configuration
    const config = nodeData.config || {};
    const method = (config.method || 'GET').toUpperCase();
    const url = config.url || '';
    const headers = config.headers || {};
    const timeout = config.timeout || 30000;

    // Validation
    if (!url) {
      throw new Error('HTTP node requires a URL');
    }

    try {
      let requestConfig: any = {
        method,
        url,
        headers: {
          'User-Agent': 'FlowForge/1.0',
          ...headers
        },
        timeout
      };

      // Add request body for POST/PUT/PATCH
      if (['POST', 'PUT', 'PATCH'].includes(method)) {
        requestConfig.data = config.body || nodeData.inputs || {};
        
        if (!requestConfig.headers['Content-Type']) {
          requestConfig.headers['Content-Type'] = 'application/json';
        }
      }

      // Add query parameters for GET
      if (method === 'GET' && config.params) {
        requestConfig.params = config.params;
      }

      // Execute request
      const response = await axios(requestConfig);

      // Return structured result
      return {
        statusCode: response.status,
        statusText: response.statusText,
        headers: response.headers,
        data: response.data,
        success: true
      };

    } catch (error: any) {
      // Handle axios errors gracefully
      if (error.response) {
        return {
          statusCode: error.response.status,
          statusText: error.response.statusText,
          headers: error.response.headers,
          data: error.response.data,
          error: error.message,
          success: false
        };
      }

      throw new Error(`HTTP request failed: ${error.message}`);
    }
  }
}

export const httpNodeExecutor = new HttpNodeExecutor();
```

#### Frontend Component

```jsx
// packages/client/src/components/nodes/HttpNode.jsx
import React from 'react';
import { Handle, Position } from '@xyflow/react';

export default function HttpNode({ data }) {
  return (
    <div className="p-3 rounded-lg bg-indigo-50 border-2 border-indigo-500 min-w-[150px] text-center">
      <div className="font-bold text-indigo-700 text-xs uppercase tracking-wide">
        HTTP
      </div>
      <div className="mt-1 text-sm text-gray-800">
        {data.label}
      </div>
      <Handle
        type="target"
        position={Position.Left}
        className="!bg-indigo-500"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!bg-indigo-500"
      />
    </div>
  );
}
```

#### Usage in Workflow

```json
{
  "nodes": [
    {
      "id": "trigger-1",
      "type": "trigger",
      "data": {
        "label": "Manual Trigger",
        "config": { "triggerType": "manual" }
      }
    },
    {
      "id": "http-1",
      "type": "http",
      "data": {
        "label": "Fetch User Data",
        "config": {
          "method": "GET",
          "url": "https://jsonplaceholder.typicode.com/users/1",
          "headers": {}
        }
      }
    },
    {
      "id": "slack-1",
      "type": "slack",
      "data": {
        "label": "Send Notification",
        "config": {
          "webhookUrl": "https://hooks.slack.com/...",
          "message": "User ${http-1.data.name} has email ${http-1.data.email}"
        }
      }
    }
  ],
  "edges": [
    { "id": "e1", "source": "trigger-1", "target": "http-1" },
    { "id": "e2", "source": "http-1", "target": "slack-1" }
  ]
}
```

---

## Best Practices

### 1. Error Handling

```typescript
// Always provide clear error messages
if (!requiredParam) {
  throw new Error('Integration name requires paramName');
}

// Gracefully handle external API errors
try {
  const response = await externalApi.call();
  return { success: true, data: response };
} catch (error: any) {
  if (error.response) {
    // Return structured error instead of throwing
    return {
      success: false,
      error: error.message,
      statusCode: error.response.status,
      details: error.response.data
    };
  }
  throw new Error(`Operation failed: ${error.message}`);
}
```

### 2. Data Transformation

```typescript
// Always return structured, predictable data
return {
  success: boolean,           // Operation status
  data: any,                  // Primary result data
  metadata?: {                // Optional metadata
    timestamp: string,
    duration: number,
    requestId: string
  },
  error?: string              // Error message if applicable
};
```

### 3. Variable Replacement

```typescript
// Create reusable helper methods
private replaceVariables(template: string, context: ExecutionContext): string {
  let result = template;
  const variables = template.match(/\${([^}]+)}/g) || [];
  
  for (const variable of variables) {
    const varName = variable.slice(2, -1);
    const value = this.getNestedValue(context.data, varName) || '';
    result = result.replace(variable, String(value));
  }
  
  return result;
}

// Apply to all user-configurable strings
const processedUrl = this.replaceVariables(config.url, context);
const processedMessage = this.replaceVariables(config.message, context);
```

### 4. Credentials & Security

```typescript
// Use environment variables for secrets
const apiKey = config.apiKey || process.env.YOUR_SERVICE_API_KEY;

if (!apiKey) {
  throw new Error('API key is required. Set YOUR_SERVICE_API_KEY or provide in config.');
}

// Never log sensitive data
console.log('API Key:', apiKey.slice(0, 4) + '****'); // ✓ Safe
console.log('API Key:', apiKey); // ✗ Unsafe
```

### 5. Validation

```typescript
// Validate all required parameters
async execute(context: ExecutionContext, nodeData: any): Promise<any> {
  const config = nodeData.config || {};
  
  // Validate required fields
  const required = ['url', 'method'];
  for (const field of required) {
    if (!config[field]) {
      throw new Error(`${field} is required for HTTP node`);
    }
  }
  
  // Validate enum values
  const validMethods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];
  if (!validMethods.includes(config.method.toUpperCase())) {
    throw new Error(`Invalid method. Must be one of: ${validMethods.join(', ')}`);
  }
  
  // Continue with execution...
}
```

### 6. Timeout Handling

```typescript
// Always set reasonable timeouts
const timeout = config.timeout || 30000; // 30 seconds default

const response = await axios({
  url,
  method,
  timeout,
  // ... other config
});
```

### 7. Logging for Debugging

```typescript
// Add debug logs in development
if (process.env.NODE_ENV === 'development') {
  console.log('Node execution:', {
    nodeId: context.executionId,
    config: nodeData.config,
    contextData: Object.keys(context.data)
  });
}
```

---

## Testing Integrations

### Unit Test Example

```typescript
// packages/server/src/integrations/__tests__/http-node.test.ts
import { describe, it, expect, vi } from 'vitest';
import { httpNodeExecutor } from '../http-node';
import { ExecutionContext } from '../../types/workflow';

describe('HttpNodeExecutor', () => {
  it('should execute GET request successfully', async () => {
    const context: ExecutionContext = {
      workflowId: 'wf-1',
      executionId: 'exec-1',
      data: {},
      logs: []
    };

    const nodeData = {
      config: {
        method: 'GET',
        url: 'https://jsonplaceholder.typicode.com/users/1'
      }
    };

    const result = await httpNodeExecutor.execute(context, nodeData);

    expect(result.success).toBe(true);
    expect(result.statusCode).toBe(200);
    expect(result.data).toBeDefined();
  });

  it('should throw error when URL is missing', async () => {
    const context: ExecutionContext = {
      workflowId: 'wf-1',
      executionId: 'exec-1',
      data: {},
      logs: []
    };

    const nodeData = {
      config: {
        method: 'GET'
      }
    };

    await expect(
      httpNodeExecutor.execute(context, nodeData)
    ).rejects.toThrow('HTTP node requires a URL');
  });

  it('should handle variable replacement', async () => {
    const context: ExecutionContext = {
      workflowId: 'wf-1',
      executionId: 'exec-1',
      data: {
        'trigger-1': { userId: 123 }
      },
      logs: []
    };

    const nodeData = {
      config: {
        method: 'GET',
        url: 'https://api.example.com/users/${trigger-1.userId}'
      }
    };

    // Test would require mocking axios to verify URL transformation
  });
});
```

### Running Tests

```bash
# Run all tests
pnpm test

# Run specific test file
vitest run --reporter=verbose packages/server/src/integrations/__tests__/http-node.test.ts

# Watch mode
pnpm test:watch
```

---

## Advanced Patterns

### 1. Conditional Execution

Some nodes may want to control downstream execution:

```typescript
// Condition node example
return {
  result: someCondition,
  continue: someCondition  // Controls downstream execution
};
```

### 2. Batch Processing

Process multiple items from previous node:

```typescript
async execute(context: ExecutionContext, nodeData: any): Promise<any> {
  const previousData = context.data['previous-node-id'];
  const items = previousData.items || [];
  
  const results = [];
  for (const item of items) {
    const result = await this.processItem(item);
    results.push(result);
  }
  
  return {
    success: true,
    processed: results.length,
    results
  };
}
```

### 3. Streaming/Webhook Triggers

For trigger nodes that listen to external events:

```typescript
export class WebhookTriggerExecutor implements NodeExecutor {
  async execute(context: ExecutionContext, nodeData: any): Promise<any> {
    // Register webhook endpoint
    const webhookUrl = await this.registerWebhook(nodeData.config);
    
    return {
      triggered: true,
      webhookUrl,
      listenAt: new Date().toISOString()
    };
  }
}
```

---

## Integration Checklist

When creating a new integration, ensure:

- [ ] Backend executor implements `NodeExecutor` interface
- [ ] Frontend component uses React Flow handles
- [ ] Validation for all required parameters
- [ ] Variable replacement support (`${nodeId.path}` syntax)
- [ ] Proper error handling with clear messages
- [ ] Structured return data format
- [ ] Security: No logging of sensitive data
- [ ] Timeouts configured for external calls
- [ ] Unit tests written
- [ ] Integration registered in `executor.ts`
- [ ] Documentation updated

---

## Common Patterns Reference

### Variable Replacement Helper

**Use the shared utility functions** instead of implementing your own:

```typescript
import { replaceVariables, getNestedValue } from '../utils/variable-utils.js';

// Replace variables in templates
const processed = replaceVariables('Hello ${user.name}', context.data);

// Access nested properties
const value = getNestedValue(context.data, 'node-1.data.userId');
```

The shared utility is located at `packages/server/src/utils/variable-utils.ts` and provides:
- `replaceVariables(template: string, contextData: any): string` - Replace `${...}` placeholders
- `getNestedValue(obj: any, path: string): any` - Access nested properties via dot notation

### Configuration Extraction

```typescript
const config = nodeData.config || {};
const param1 = config.param1 || 'default';
const param2 = config.param2 || process.env.FALLBACK_ENV_VAR;
```

### Standard Return Format

```typescript
return {
  success: true,
  data: resultData,
  metadata: {
    timestamp: new Date().toISOString(),
    duration: Date.now() - startTime
  }
};
```

---

## Resources

- **Core Types**: `packages/server/src/types/workflow.ts`
- **Executor Engine**: `packages/server/src/core/executor.ts`
- **Variable Utilities**: `packages/server/src/utils/variable-utils.ts`
- **Example Integrations**: `packages/server/src/integrations/`
- **React Flow Docs**: https://reactflow.dev/
- **Testing Framework**: https://vitest.dev/

---

## Getting Help

For questions or issues:
1. Check existing integration implementations in `packages/server/src/integrations/`
2. Review the executor engine in `packages/server/src/core/executor.ts`
3. Consult workflow type definitions in `packages/server/src/types/workflow.ts`
4. Open an issue in the GitHub repository

---

**Happy Building! 🚀**
