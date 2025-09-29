import { Workflow, WorkflowNode, ExecutionContext, ExecutionLog, NodeExecutor } from '../types/workflow.js';
import { httpNodeExecutor } from '../integrations/http-node.js';
import { openRouterNodeExecutor } from '../ai/openrouter-node.js';
import { slackNodeExecutor } from '../integrations/slack-node.js';
import { emailNodeExecutor } from '../integrations/email-node.js';
import { sheetsNodeExecutor } from '../integrations/sheets-node.js';

// Utility function for nested property access
function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : undefined;
  }, obj);
}

export class WorkflowExecutor {
  private nodeExecutors = new Map<string, NodeExecutor>();

  constructor() {
    this.registerBuiltInExecutors();
  }

  registerExecutor(nodeType: string, executor: NodeExecutor) {
    this.nodeExecutors.set(nodeType, executor);
  }

  async executeWorkflow(workflow: Workflow, inputData: Record<string, any> = {}): Promise<ExecutionContext> {
    const executionId = `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const context: ExecutionContext = {
      workflowId: workflow.id,
      executionId,
      data: inputData,
      logs: []
    };

    try {
      // Find trigger nodes to start execution
      const triggerNodes = workflow.nodes.filter(node => node.type === 'trigger');
      
      if (triggerNodes.length === 0) {
        throw new Error('No trigger nodes found in workflow');
      }

      // Execute from each trigger node
      for (const triggerNode of triggerNodes) {
        await this.executeFromNode(workflow, triggerNode, context);
      }

      this.addLog(context, 'system', 'info', 'Workflow execution completed');
      return context;

    } catch (error) {
      this.addLog(context, 'system', 'error', `Workflow execution failed: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  private async executeFromNode(workflow: Workflow, node: WorkflowNode, context: ExecutionContext): Promise<any> {
    this.addLog(context, node.id, 'info', `Executing node: ${node.data.label}`);

    try {
      const executor = this.nodeExecutors.get(node.type);
      if (!executor) {
        throw new Error(`No executor found for node type: ${node.type}`);
      }

      const result = await executor.execute(context, node.data);
      
      // Store result in context (safely serialize to avoid circular references)
      context.data[node.id] = this.safeSerialize(result);
      
      this.addLog(context, node.id, 'info', 'Node executed successfully', result);

      // Find and execute connected nodes
      const outgoingEdges = workflow.edges.filter(edge => edge.source === node.id);
      
      for (const edge of outgoingEdges) {
        const targetNode = workflow.nodes.find(n => n.id === edge.target);
        if (targetNode) {
          // For condition nodes, check if we should continue
          if (node.type === 'condition' && !this.shouldContinueExecution(result)) {
            this.addLog(context, node.id, 'info', 'Condition not met, skipping downstream nodes');
            continue;
          }
          
          await this.executeFromNode(workflow, targetNode, context);
        }
      }

      return result;

    } catch (error) {
      this.addLog(context, node.id, 'error', `Node execution failed: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  private shouldContinueExecution(conditionResult: any): boolean {
    if (typeof conditionResult === 'boolean') return conditionResult;
    if (typeof conditionResult === 'object' && conditionResult !== null) {
      return conditionResult.continue === true;
    }
    return Boolean(conditionResult);
  }

  private addLog(context: ExecutionContext, nodeId: string, level: ExecutionLog['level'], message: string, data?: any) {
    context.logs.push({
      nodeId,
      timestamp: new Date().toISOString(),
      level,
      message,
      data: data ? this.safeSerialize(data) : undefined
    });
  }

  private safeSerialize(obj: any): any {
    const seen = new WeakSet();
    return JSON.parse(JSON.stringify(obj, (key, value) => {
      if (typeof value === 'object' && value !== null) {
        if (seen.has(value)) {
          return '[Circular Reference]';
        }
        seen.add(value);
      }
      return value;
    }));
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined;
    }, obj);
  }

  private registerBuiltInExecutors() {
    // Basic trigger executor
    this.registerExecutor('trigger', {
      async execute(context: ExecutionContext, nodeData: any) {
        return {
          triggered: true,
          timestamp: new Date().toISOString(),
          triggerType: nodeData.config.triggerType || 'manual',
          inputData: Object.keys(context.data).length > 0 ? { ...context.data } : {}
        };
      }
    });

    // Basic action executor
    this.registerExecutor('action', {
      async execute(context: ExecutionContext, nodeData: any) {
        const actionType = nodeData.config.actionType || 'log';
        
        switch (actionType) {
          case 'log':
            const logMessage = nodeData.config.message || 'No message';
            // Replace variables in log message with context data
            let processedLogMessage = logMessage;
            const variables = logMessage.match(/\${([^}]+)}/g) || [];
            for (const variable of variables) {
              const varName = variable.slice(2, -1);
              const value = getNestedValue(context.data, varName) || '';
              processedLogMessage = processedLogMessage.replace(variable, String(value));
            }
            console.log('Action executed:', processedLogMessage);
            return { action: 'logged', message: processedLogMessage, originalMessage: logMessage };
          
          case 'transform':
            const input = nodeData.inputs || context.data;
            return { transformed: true, result: input };
          
          case 'http':
            // Delegate to HTTP node executor
            return await httpNodeExecutor.execute(context, nodeData);
          
          case 'slack':
            // Delegate to Slack node executor  
            return await slackNodeExecutor.execute(context, nodeData);
          
          case 'email':
            // Delegate to Email node executor
            return await emailNodeExecutor.execute(context, nodeData);
          
          case 'sheets':
            // Delegate to Sheets node executor
            return await sheetsNodeExecutor.execute(context, nodeData);
          
          default:
            return { action: actionType, executed: true };
        }
      }
    });

    // Basic condition executor
    this.registerExecutor('condition', {
      async execute(context: ExecutionContext, nodeData: any) {
        const condition = nodeData.config.condition || 'true';
        const conditionData = nodeData.inputs || context.data;
        
        // Simple condition evaluation (can be enhanced later)
        let result = false;
        try {
          // For MVP, support simple conditions like "data.value > 10"
          if (condition === 'true') result = true;
          else if (condition === 'false') result = false;
          else {
            // Basic evaluation - in production, use a safe expression evaluator
            result = Boolean(conditionData);
          }
        } catch (error) {
          result = false;
        }

        return {
          condition,
          result,
          continue: result
        };
      }
    });

    // Register integration nodes
    this.registerExecutor('http', httpNodeExecutor);
    this.registerExecutor('ai', openRouterNodeExecutor);
    this.registerExecutor('slack', slackNodeExecutor);
    this.registerExecutor('email', emailNodeExecutor);
    this.registerExecutor('sheets', sheetsNodeExecutor);
  }
}

export const workflowExecutor = new WorkflowExecutor();
