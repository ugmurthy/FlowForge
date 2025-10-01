import { Workflow, WorkflowNode, ExecutionContext, ExecutionLog, NodeExecutor } from '../types/workflow.js';
import { httpNodeExecutor } from '../integrations/http-node.js';
import { openRouterNodeExecutor } from '../ai/openrouter-node.js';
import { ollamaNodeExecutor } from '../ai/ollama-node.js';
import { slackNodeExecutor } from '../integrations/slack-node.js';
import { emailNodeExecutor } from '../integrations/email-node.js';
import { sheetsNodeExecutor } from '../integrations/sheets-node.js';
import { getNestedValue, replaceVariables } from '../utils/variable-utils.js';

interface ExecutionOptions {
  continueOnError?: boolean;
  retryPolicy?: {
    maxRetries: number;
    backoffMs: number;
  };
  timeout?: number;
}

interface NodeMetrics {
  startTime: number;
  endTime: number;
  duration: number;
  retries: number;
  status: 'success' | 'failed' | 'skipped';
}

export class WorkflowExecutor {
  private nodeExecutors = new Map<string, NodeExecutor>();

  constructor() {
    this.registerBuiltInExecutors();
  }

  registerExecutor(nodeType: string, executor: NodeExecutor) {
    this.nodeExecutors.set(nodeType, executor);
  }

  getAvailableNodeTypes(): string[] {
    return Array.from(this.nodeExecutors.keys());
  }

  async executeWorkflow(workflow: Workflow, inputData: Record<string, any> = {}, options: ExecutionOptions = {}): Promise<ExecutionContext> {
    const executionId = `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const context: ExecutionContext = {
      workflowId: workflow.id,
      executionId,
      data: inputData,
      logs: []
    };

    const metrics = new Map<string, NodeMetrics>();

    try {
      // Phase 1 & 2: Build dependency graph and detect cycles
      const { inDegree, adjacency } = this.buildDependencyGraph(workflow);
      this.detectCycles(workflow, inDegree);

      // Phase 3: Topological sort with Phase 4: Parallel execution
      await this.executeTopologically(workflow, context, inDegree, adjacency, metrics, options);

      this.addLog(context, 'system', 'info', 'Workflow execution completed', { metrics: this.serializeMetrics(metrics) });
      return context;

    } catch (error) {
      this.addLog(context, 'system', 'error', `Workflow execution failed: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  private buildDependencyGraph(workflow: Workflow): { inDegree: Map<string, number>, adjacency: Map<string, string[]> } {
    const inDegree = new Map<string, number>();
    const adjacency = new Map<string, string[]>();

    // Initialize all nodes with in-degree 0
    for (const node of workflow.nodes) {
      inDegree.set(node.id, 0);
      adjacency.set(node.id, []);
    }

    // Build adjacency list and calculate in-degrees
    for (const edge of workflow.edges) {
      const currentTargets = adjacency.get(edge.source) || [];
      currentTargets.push(edge.target);
      adjacency.set(edge.source, currentTargets);
      
      const currentInDegree = inDegree.get(edge.target) || 0;
      inDegree.set(edge.target, currentInDegree + 1);
    }

    return { inDegree, adjacency };
  }

  private detectCycles(workflow: Workflow, inDegree: Map<string, number>): void {
    const workingInDegree = new Map(inDegree);
    const queue: string[] = [];

    // Find all nodes with in-degree 0
    for (const [nodeId, degree] of workingInDegree.entries()) {
      if (degree === 0) {
        queue.push(nodeId);
      }
    }

    const processed: string[] = [];

    while (queue.length > 0) {
      const nodeId = queue.shift()!;
      processed.push(nodeId);

      const node = workflow.nodes.find(n => n.id === nodeId);
      if (!node) continue;

      const outgoingEdges = workflow.edges.filter(e => e.source === nodeId);
      for (const edge of outgoingEdges) {
        const currentDegree = workingInDegree.get(edge.target) || 0;
        workingInDegree.set(edge.target, currentDegree - 1);
        
        if (workingInDegree.get(edge.target) === 0) {
          queue.push(edge.target);
        }
      }
    }

    // If not all nodes were processed, there's a cycle
    if (processed.length !== workflow.nodes.length) {
      const unprocessed = workflow.nodes
        .filter(n => !processed.includes(n.id))
        .map(n => n.id)
        .join(', ');
      throw new Error(`Cycle detected in workflow. Nodes involved: ${unprocessed}`);
    }
  }

  private async executeTopologically(
    workflow: Workflow,
    context: ExecutionContext,
    inDegree: Map<string, number>,
    adjacency: Map<string, string[]>,
    metrics: Map<string, NodeMetrics>,
    options: ExecutionOptions
  ): Promise<void> {
    const workingInDegree = new Map(inDegree);
    const executedNodes = new Set<string>();
    const skippedNodes = new Set<string>();
    
    // Find all nodes with in-degree 0 (starting nodes)
    let currentLevel: string[] = [];
    for (const [nodeId, degree] of workingInDegree.entries()) {
      if (degree === 0) {
        currentLevel.push(nodeId);
      }
    }

    while (currentLevel.length > 0) {
      // Phase 4: Execute all nodes at current level IN PARALLEL
      await Promise.all(currentLevel.map(async (nodeId) => {
        // Skip if already executed or skipped
        if (executedNodes.has(nodeId) || skippedNodes.has(nodeId)) {
          return;
        }

        const node = workflow.nodes.find(n => n.id === nodeId);
        if (!node) return;

        // Phase 5: Execute node with retry logic, timeout, and metrics
        const nodeResult = await this.executeNodeWithRetry(node, context, options, metrics);

        executedNodes.add(nodeId);

        // Phase 5: Conditional branch pruning
        if (node.type === 'condition' && !this.shouldContinueExecution(nodeResult)) {
          this.addLog(context, node.id, 'info', 'Condition not met, pruning downstream nodes');
          const downstreamNodes = this.getDownstreamNodes(nodeId, adjacency, workflow);
          for (const downstreamId of downstreamNodes) {
            skippedNodes.add(downstreamId);
            metrics.set(downstreamId, {
              startTime: Date.now(),
              endTime: Date.now(),
              duration: 0,
              retries: 0,
              status: 'skipped'
            });
          }
        }
      }));

      // Find next level of nodes to execute
      const nextLevel: string[] = [];
      for (const nodeId of currentLevel) {
        const targets = adjacency.get(nodeId) || [];
        for (const targetId of targets) {
          if (executedNodes.has(targetId) || skippedNodes.has(targetId)) {
            continue;
          }

          const currentDegree = workingInDegree.get(targetId) || 0;
          workingInDegree.set(targetId, currentDegree - 1);

          // If all dependencies are satisfied, add to next level
          if (workingInDegree.get(targetId) === 0 && !nextLevel.includes(targetId)) {
            nextLevel.push(targetId);
          }
        }
      }

      currentLevel = nextLevel;
    }
  }

  private async executeNodeWithRetry(
    node: WorkflowNode,
    context: ExecutionContext,
    options: ExecutionOptions,
    metrics: Map<string, NodeMetrics>
  ): Promise<any> {
    const maxRetries = options.retryPolicy?.maxRetries || 0;
    const backoffMs = options.retryPolicy?.backoffMs || 1000;
    const timeout = options.timeout || 30000; // 30s default timeout

    const startTime = Date.now();
    let lastError: Error | null = null;
    let retries = 0;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        this.addLog(context, node.id, 'info', `Executing node: ${node.data.label}${attempt > 0 ? ` (retry ${attempt})` : ''}`);

        const result = await Promise.race([
          this.executeSingleNode(node, context),
          this.createTimeout(timeout, node.id)
        ]);

        context.data[node.id] = this.safeSerialize(result);
        this.addLog(context, node.id, 'info', 'Node executed successfully', result);

        const endTime = Date.now();
        metrics.set(node.id, {
          startTime,
          endTime,
          duration: endTime - startTime,
          retries: attempt,
          status: 'success'
        });

        return result;

      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        retries = attempt;

        if (attempt < maxRetries) {
          this.addLog(context, node.id, 'warn', `Node execution failed, retrying in ${backoffMs}ms: ${lastError.message}`);
          await this.delay(backoffMs * (attempt + 1)); // Exponential backoff
        }
      }
    }

    // All retries exhausted
    const endTime = Date.now();
    const errorMessage = `Node execution failed after ${retries + 1} attempts: ${lastError?.message}`;

    if (options.continueOnError) {
      this.addLog(context, node.id, 'error', `${errorMessage} (continuing workflow)`);
      metrics.set(node.id, {
        startTime,
        endTime,
        duration: endTime - startTime,
        retries,
        status: 'failed'
      });
      context.data[node.id] = { error: lastError?.message, skipped: true };
      return { error: lastError?.message, skipped: true };
    }

    this.addLog(context, node.id, 'error', errorMessage);
    metrics.set(node.id, {
      startTime,
      endTime,
      duration: endTime - startTime,
      retries,
      status: 'failed'
    });
    throw lastError;
  }

  private async executeSingleNode(node: WorkflowNode, context: ExecutionContext): Promise<any> {
    const executor = this.nodeExecutors.get(node.type);
    if (!executor) {
      throw new Error(`No executor found for node type: ${node.type}`);
    }

    return await executor.execute(context, node.data);
  }

  private createTimeout(ms: number, nodeId: string): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Node ${nodeId} execution timeout after ${ms}ms`));
      }, ms);
    });
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private getDownstreamNodes(nodeId: string, adjacency: Map<string, string[]>, workflow: Workflow): Set<string> {
    const downstream = new Set<string>();
    const queue = [nodeId];
    const visited = new Set<string>();

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (visited.has(current)) continue;
      visited.add(current);

      const targets = adjacency.get(current) || [];
      for (const target of targets) {
        downstream.add(target);
        queue.push(target);
      }
    }

    return downstream;
  }

  private shouldContinueExecution(conditionResult: any): boolean {
    if (typeof conditionResult === 'boolean') return conditionResult;
    if (typeof conditionResult === 'object' && conditionResult !== null) {
      return conditionResult.continue === true;
    }
    return Boolean(conditionResult);
  }

  private serializeMetrics(metrics: Map<string, NodeMetrics>): Record<string, NodeMetrics> {
    const result: Record<string, NodeMetrics> = {};
    for (const [nodeId, metric] of metrics.entries()) {
      result[nodeId] = metric;
    }
    return result;
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
            const processedLogMessage = replaceVariables(logMessage, context.data);
            console.log('Action executed:', processedLogMessage);
            return { action: 'logged', message: processedLogMessage, originalMessage: logMessage };
          
          case 'transform':
            const input = nodeData.inputs || context.data;
            return { transformed: true, result: input };
          
          case 'http':
            return await httpNodeExecutor.execute(context, nodeData);
          
          case 'slack':
            return await slackNodeExecutor.execute(context, nodeData);
          
          case 'email':
            return await emailNodeExecutor.execute(context, nodeData);
          
          case 'sheets':
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
        
        let result = false;
        try {
          if (condition === 'true') result = true;
          else if (condition === 'false') result = false;
          else {
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
    this.registerExecutor('ollama', ollamaNodeExecutor);
    this.registerExecutor('slack', slackNodeExecutor);
    this.registerExecutor('email', emailNodeExecutor);
    this.registerExecutor('sheets', sheetsNodeExecutor);
  }
}

export const workflowExecutor = new WorkflowExecutor();
