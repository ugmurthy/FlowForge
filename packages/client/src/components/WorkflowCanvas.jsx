import React, { useCallback, useState, useEffect } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Save, Loader2 } from 'lucide-react';

import TriggerNode from './nodes/TriggerNode';
import ActionNode from './nodes/ActionNode';
import ConditionNode from './nodes/ConditionNode';
import HttpNode from './nodes/HttpNode';
import AiNode from './nodes/AiNode';
import OllamaNode from './nodes/OllamaNode';
import SlackNode from './nodes/SlackNode';
import EmailNode from './nodes/EmailNode';
import SheetsNode from './nodes/SheetsNode';

import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

const nodeTypes = {
  trigger: TriggerNode,
  action: ActionNode,
  condition: ConditionNode,
  http: HttpNode,
  ai: AiNode,
  ollama: OllamaNode,
  slack: SlackNode,
  email: EmailNode,
  sheets: SheetsNode,
};

const initialNodes = [];
const initialEdges = [];

export default function WorkflowCanvas() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [workflows, setWorkflows] = useState([]);
  const [currentWorkflow, setCurrentWorkflow] = useState(null);
  const [loading, setLoading] = useState(true);
  const [availableNodeTypes, setAvailableNodeTypes] = useState([]);

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    [setEdges],
  );

  // Load available node types from API
  useEffect(() => {
    const fetchNodeTypes = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/node-types');
        const data = await response.json();
        console.log('Fetched node types:', data.nodeTypes);
        setAvailableNodeTypes(data.nodeTypes || []);
      } catch (error) {
        console.error('Failed to fetch node types:', error);
        // Fallback to default node types if API fails
        setAvailableNodeTypes(['trigger', 'action', 'condition', 'http', 'ai', 'ollama', 'slack', 'email', 'sheets']);
      }
    };
    
    fetchNodeTypes();
  }, []);

  // Load workflows from API
  useEffect(() => {
    const fetchWorkflows = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/workflows');
        const data = await response.json();
        setWorkflows(data.workflows || []);
        
        // Load the first workflow if available
        if (data.workflows && data.workflows.length > 0) {
          loadWorkflow(data.workflows[0]);
        }
      } catch (error) {
        console.error('Failed to fetch workflows:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchWorkflows();
  }, []);

  const loadWorkflow = useCallback((workflow) => {
    setCurrentWorkflow(workflow);
    setNodes(workflow.nodes || []);
    setEdges(workflow.edges || []);
  }, [setNodes, setEdges]);

  const addNode = useCallback((type, position = null) => {
    const newNode = {
      id: `${Date.now()}`, // Use timestamp for unique ID
      type,
      position: position || {
        x: Math.random() * 400,
        y: Math.random() * 400,
      },
      data: { label: `${type.charAt(0).toUpperCase() + type.slice(1)} Node` },
    };
    setNodes((nds) => nds.concat(newNode));
  }, [setNodes]);

  const onDragStart = useCallback((event, nodeType) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  }, []);

  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/reactflow');
      if (!type) return;

      const reactFlowBounds = event.target.getBoundingClientRect();
      const position = {
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      };

      addNode(type, position);
    },
    [addNode]
  );

  const saveWorkflow = useCallback(async () => {
    if (!currentWorkflow) return;
    
    try {
      const workflowData = {
        name: currentWorkflow.name,
        description: currentWorkflow.description,
        nodes,
        edges
      };
      
      const response = await fetch(`http://localhost:3001/api/workflows/${currentWorkflow.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(workflowData)
      });
      
      if (response.ok) {
        alert('Workflow saved successfully!');
      } else {
        alert('Failed to save workflow');
      }
    } catch (error) {
      console.error('Error saving workflow:', error);
      alert('Error saving workflow');
    }
  }, [currentWorkflow, nodes, edges]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading workflows...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-screen h-screen">
      {/* Workflow Selector */}
      <Card className="absolute top-2.5 right-2.5 z-50 min-w-[280px]">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">
            Current Workflow: {currentWorkflow?.name || 'None'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {workflows.length > 0 && (
            <Select 
              value={currentWorkflow?.id || ''} 
              onValueChange={(value) => {
                const selected = workflows.find(w => w.id === value);
                if (selected) loadWorkflow(selected);
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a workflow..." />
              </SelectTrigger>
              <SelectContent>
                {workflows.map(workflow => (
                  <SelectItem key={workflow.id} value={workflow.id}>
                    {workflow.name} ({workflow.nodes.length} nodes)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          
          {currentWorkflow && (
            <div className="space-y-2">
              <Button 
                onClick={saveWorkflow} 
                className="w-full"
                size="sm"
              >
                <Save className="w-4 h-4 mr-2" />
                Save Workflow
              </Button>
              <div className="text-xs text-muted-foreground">
                ID: {currentWorkflow.id.slice(0, 8)}...
              </div>
            </div>
          )}
          
          {workflows.length === 0 && (
            <div className="text-xs text-muted-foreground">
              No workflows found. Create one using the test scripts!
            </div>
          )}
        </CardContent>
      </Card>

      {/* Node Palette */}
      <Card className="absolute top-2.5 left-2.5 z-50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Add Nodes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {availableNodeTypes.length > 0 ? (
            <div className="grid gap-1">
              {availableNodeTypes.map((nodeType) => (
                <Button
                  key={nodeType}
                  onClick={() => addNode(nodeType)}
                  onDragStart={(e) => onDragStart(e, nodeType)}
                  draggable
                  variant="outline"
                  size="sm"
                  className="justify-start cursor-grab active:cursor-grabbing capitalize"
                >
                  {nodeType}
                </Button>
              ))}
            </div>
          ) : (
            <div className="text-xs text-muted-foreground">
              Loading node types...
            </div>
          )}
        </CardContent>
      </Card>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onDrop={onDrop}
        onDragOver={onDragOver}
        nodeTypes={nodeTypes}
        fitView
      >
        <Controls />
        <MiniMap />
      
        <Background
        variant="lines"
        gap={10}
        color='#f1f1f1'
        id='1'
      />
        <Background
        variant='lines'
        gap={100}
        color='#ccc'
        id='2'
      />
      </ReactFlow>
    </div>
  );
}


