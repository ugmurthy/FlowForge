import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import { connectDatabase, disconnectDatabase } from './database/client.js';
import { workflowService } from './services/workflowService.js';
import { workflowExecutor } from './core/executor.js';
import { credentialService } from './services/credentialService.js';

// Load environment variables from .env file
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    service: 'FlowForge API'
  });
});

// Workflow endpoints
app.get('/api/workflows', async (req, res) => {
  try {
    const workflows = await workflowService.getAllWorkflows();
    res.json({ workflows });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch workflows' });
  }
});

app.get('/api/workflows/:id', async (req, res) => {
  try {
    const workflow = await workflowService.getWorkflow(req.params.id);
    if (!workflow) {
      return res.status(404).json({ error: 'Workflow not found' });
    }
    res.json({ workflow });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch workflow' });
  }
});

app.post('/api/workflows', async (req, res) => {
  try {
    const { name, description, nodes, edges } = req.body;
    const workflow = await workflowService.createWorkflow({
      name,
      description,
      nodes: nodes || [],
      edges: edges || []
    });
    res.status(201).json({ workflow });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create workflow' });
  }
});

app.put('/api/workflows/:id', async (req, res) => {
  try {
    const { name, description, nodes, edges, isActive } = req.body;
    const workflow = await workflowService.updateWorkflow(req.params.id, {
      name,
      description,
      nodes,
      edges,
      isActive
    });
    res.json({ workflow });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update workflow' });
  }
});

app.delete('/api/workflows/:id', async (req, res) => {
  try {
    await workflowService.deleteWorkflow(req.params.id);
    res.json({ message: 'Workflow deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete workflow' });
  }
});

// Execute workflow endpoint
app.post('/api/workflows/:id/execute', async (req, res) => {
  try {
    const workflow = await workflowService.getWorkflow(req.params.id);
    if (!workflow) {
      return res.status(404).json({ error: 'Workflow not found' });
    }

    // Save execution record
    const executionId = await workflowService.saveExecution({
      workflowId: workflow.id,
      status: 'running',
      inputData: req.body.inputData || {}
    });

    // Execute workflow
    const context = await workflowExecutor.executeWorkflow(workflow, req.body.inputData);
    
    // Update execution with results
    await workflowService.updateExecution(executionId, {
      status: 'completed',
      logs: context.logs,
      completedAt: new Date()
    });

    res.json({ 
      message: 'Workflow executed successfully',
      executionId,
      context
    });
  } catch (error) {
    res.status(500).json({ error: `Workflow execution failed: ${error instanceof Error ? error.message : String(error)}` });
  }
});

// Get executions
app.get('/api/executions', async (req, res) => {
  try {
    const workflowId = req.query.workflowId as string;
    const executions = await workflowService.getExecutions(workflowId);
    res.json({ executions });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch executions' });
  }
});

// Credential endpoints
app.get('/api/credentials', async (req, res) => {
  try {
    const credentials = await credentialService.getAllCredentials();
    res.json({ credentials });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch credentials' });
  }
});

app.post('/api/credentials', async (req, res) => {
  try {
    const { name, type, data } = req.body;
    const id = await credentialService.saveCredential(name, type, data);
    res.status(201).json({ id, message: 'Credential saved successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to save credential' });
  }
});

app.get('/api/credentials/:id', async (req, res) => {
  try {
    const credential = await credentialService.getCredential(req.params.id);
    if (!credential) {
      return res.status(404).json({ error: 'Credential not found' });
    }
    res.json({ credential });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch credential' });
  }
});

app.delete('/api/credentials/:id', async (req, res) => {
  try {
    await credentialService.deleteCredential(req.params.id);
    res.json({ message: 'Credential deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete credential' });
  }
});

// Initialize database and start server
async function startServer() {
  try {
    await connectDatabase();
    
    app.listen(PORT, () => {
      console.log(`FlowForge server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('Received SIGTERM, shutting down gracefully');
  await disconnectDatabase();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('Received SIGINT, shutting down gracefully');
  await disconnectDatabase();
  process.exit(0);
});

startServer();

export default app;
