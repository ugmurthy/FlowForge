export interface WorkflowNode {
  id: string;
  type: 'trigger' | 'action' | 'condition' | 'ai';
  position: { x: number; y: number };
  data: {
    label: string;
    config: Record<string, any>;
    inputs?: Record<string, any>;
    outputs?: Record<string, any>;
  };
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
}

export interface Workflow {
  id: string;
  name: string;
  description?: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}

export interface ExecutionContext {
  workflowId: string;
  executionId: string;
  data: Record<string, any>;
  logs: ExecutionLog[];
}

export interface ExecutionLog {
  nodeId: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error';
  message: string;
  data?: any;
}

export interface NodeExecutor {
  execute(context: ExecutionContext, nodeData: WorkflowNode['data']): Promise<any>;
}
