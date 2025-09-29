import { prisma } from '../database/client.js';
import { Workflow, WorkflowNode, WorkflowEdge, ExecutionContext } from '../types/workflow.js';

export class WorkflowService {
  async createWorkflow(data: {
    name: string;
    description?: string;
    nodes: WorkflowNode[];
    edges: WorkflowEdge[];
  }): Promise<Workflow> {
    const workflow = await prisma.workflow.create({
      data: {
        name: data.name,
        description: data.description,
        nodes: JSON.stringify(data.nodes),
        edges: JSON.stringify(data.edges),
        isActive: true
      }
    });

    return this.mapPrismaToWorkflow(workflow);
  }

  async getWorkflow(id: string): Promise<Workflow | null> {
    const workflow = await prisma.workflow.findUnique({
      where: { id }
    });

    if (!workflow) return null;
    return this.mapPrismaToWorkflow(workflow);
  }

  async getAllWorkflows(): Promise<Workflow[]> {
    const workflows = await prisma.workflow.findMany({
      orderBy: { updatedAt: 'desc' }
    });

    return workflows.map(this.mapPrismaToWorkflow);
  }

  async updateWorkflow(id: string, data: {
    name?: string;
    description?: string;
    nodes?: WorkflowNode[];
    edges?: WorkflowEdge[];
    isActive?: boolean;
  }): Promise<Workflow> {
    const updateData: any = {
      updatedAt: new Date()
    };

    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.nodes !== undefined) updateData.nodes = JSON.stringify(data.nodes);
    if (data.edges !== undefined) updateData.edges = JSON.stringify(data.edges);
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    const workflow = await prisma.workflow.update({
      where: { id },
      data: updateData
    });

    return this.mapPrismaToWorkflow(workflow);
  }

  async deleteWorkflow(id: string): Promise<void> {
    await prisma.workflow.delete({
      where: { id }
    });
  }

  async saveExecution(execution: {
    workflowId: string;
    status: string;
    inputData?: Record<string, any>;
    logs?: any[];
  }): Promise<string> {
    const result = await prisma.execution.create({
      data: {
        workflowId: execution.workflowId,
        status: execution.status,
        inputData: execution.inputData ? JSON.stringify(execution.inputData) : null,
        logs: execution.logs ? JSON.stringify(execution.logs) : null
      }
    });

    return result.id;
  }

  async updateExecution(id: string, data: {
    status?: string;
    logs?: any[];
    completedAt?: Date;
  }): Promise<void> {
    const updateData: any = {};
    
    if (data.status) updateData.status = data.status;
    if (data.logs) updateData.logs = JSON.stringify(data.logs);
    if (data.completedAt) updateData.completedAt = data.completedAt;

    await prisma.execution.update({
      where: { id },
      data: updateData
    });
  }

  async getExecutions(workflowId?: string): Promise<any[]> {
    const executions = await prisma.execution.findMany({
      where: workflowId ? { workflowId } : undefined,
      include: {
        workflow: {
          select: { name: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return executions.map(execution => ({
      id: execution.id,
      workflowId: execution.workflowId,
      workflowName: execution.workflow.name,
      status: execution.status,
      inputData: execution.inputData ? JSON.parse(execution.inputData) : null,
      logs: execution.logs ? JSON.parse(execution.logs) : [],
      createdAt: execution.createdAt.toISOString(),
      completedAt: execution.completedAt?.toISOString() || null
    }));
  }

  private mapPrismaToWorkflow(prismaWorkflow: any): Workflow {
    return {
      id: prismaWorkflow.id,
      name: prismaWorkflow.name,
      description: prismaWorkflow.description,
      nodes: JSON.parse(prismaWorkflow.nodes),
      edges: JSON.parse(prismaWorkflow.edges),
      createdAt: prismaWorkflow.createdAt.toISOString(),
      updatedAt: prismaWorkflow.updatedAt.toISOString(),
      isActive: prismaWorkflow.isActive
    };
  }
}

export const workflowService = new WorkflowService();
