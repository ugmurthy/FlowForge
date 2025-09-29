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

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    [setEdges],
  );

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

  const addNode = useCallback((type) => {
    const newNode = {
      id: `${Date.now()}`, // Use timestamp for unique ID
      type,
      position: {
        x: Math.random() * 400,
        y: Math.random() * 400,
      },
      data: { label: `${type.charAt(0).toUpperCase() + type.slice(1)} Node` },
    };
    setNodes((nds) => nds.concat(newNode));
  }, [setNodes]);

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
          <div className="grid gap-1">
            <Button 
              onClick={() => addNode('trigger')} 
              variant="outline" 
              size="sm" 
              className="justify-start"
            >
              Trigger
            </Button>
            <Button 
              onClick={() => addNode('action')} 
              variant="outline" 
              size="sm" 
              className="justify-start"
            >
              Action
            </Button>
            <Button 
              onClick={() => addNode('condition')} 
              variant="outline" 
              size="sm" 
              className="justify-start"
            >
              Condition
            </Button>
          </div>
          <hr className="my-2" />
          <div className="grid gap-1">
            <Button 
              onClick={() => addNode('http')} 
              variant="outline" 
              size="sm" 
              className="justify-start"
            >
              HTTP
            </Button>
            <Button 
              onClick={() => addNode('ai')} 
              variant="outline" 
              size="sm" 
              className="justify-start"
            >
              AI
            </Button>
            <Button 
              onClick={() => addNode('slack')} 
              variant="outline" 
              size="sm" 
              className="justify-start"
            >
              Slack
            </Button>
            <Button 
              onClick={() => addNode('email')} 
              variant="outline" 
              size="sm" 
              className="justify-start"
            >
              Email
            </Button>
            <Button 
              onClick={() => addNode('sheets')} 
              variant="outline" 
              size="sm" 
              className="justify-start"
            >
              Sheets
            </Button>
          </div>
        </CardContent>
      </Card>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
      >
        <Controls />
        <MiniMap />
        <Background variant="dots" gap={12} size={1} />
      </ReactFlow>
    </div>
  );
}


