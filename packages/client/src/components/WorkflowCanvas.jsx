import React, { useCallback, useState, useEffect, useRef } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  ReactFlowProvider,
  useReactFlow,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Plus, FolderOpen, Save, ChevronDown, Loader2 } from 'lucide-react';

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

// Component to handle viewport adjustments - must be inside ReactFlow
function ViewportAdjuster({ nodeCount }) {
  const { fitView } = useReactFlow();

  useEffect(() => {
    const handleResize = () => {
      if (nodeCount > 0) {
        fitView({ 
          padding: 0.2,
          duration: 300,
        });
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [fitView, nodeCount]);

  return null;
}

export default function WorkflowCanvas() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [workflows, setWorkflows] = useState([]);
  const [currentWorkflow, setCurrentWorkflow] = useState(null);
  const [workflowName, setWorkflowName] = useState('Untitled Workflow');
  const [loading, setLoading] = useState(true);
  const [availableNodeTypes, setAvailableNodeTypes] = useState([]);
  const [showLoadMenu, setShowLoadMenu] = useState(false);
  const [showSaveMenu, setShowSaveMenu] = useState(false);
  const [showSaveAsDialog, setShowSaveAsDialog] = useState(false);
  const [saveAsName, setSaveAsName] = useState('');
  const [saveAsDescription, setSaveAsDescription] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);
  const nameInputRef = useRef(null);

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

  // Load workflows from API (but don't auto-load)
  useEffect(() => {
    const fetchWorkflows = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/workflows');
        const data = await response.json();
        setWorkflows(data.workflows || []);
      } catch (error) {
        console.error('Failed to fetch workflows:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchWorkflows();
  }, []);

  // Focus name input when editing
  useEffect(() => {
    if (isEditingName && nameInputRef.current) {
      nameInputRef.current.focus();
      nameInputRef.current.select();
    }
  }, [isEditingName]);

  const newWorkflow = useCallback(() => {
    setCurrentWorkflow(null);
    setWorkflowName('Untitled Workflow');
    setNodes([]);
    setEdges([]);
  }, [setNodes, setEdges]);

  const loadWorkflow = useCallback((workflow) => {
    setCurrentWorkflow(workflow);
    setWorkflowName(workflow.name);
    const nodesWithWorkflowId = (workflow.nodes || []).map(node => ({
      ...node,
      data: {
        ...node.data,
        workflowId: workflow.id
      }
    }));
    setNodes(nodesWithWorkflowId);
    setEdges(workflow.edges || []);
    setShowLoadMenu(false);
  }, [setNodes, setEdges]);

  const addNode = useCallback((type, position = null) => {
    const newNode = {
      id: `${Date.now()}`,
      type,
      position: position || {
        x: Math.random() * 400,
        y: Math.random() * 400,
      },
      data: { 
        label: `${type.charAt(0).toUpperCase() + type.slice(1)} Node`,
        workflowId: currentWorkflow?.id
      },
    };
    setNodes((nds) => nds.concat(newNode));
  }, [setNodes, currentWorkflow]);

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
      // Sync workflowId in all nodes before saving
      const syncedNodes = nodes.map(node => ({
        ...node,
        data: {
          ...node.data,
          workflowId: currentWorkflow.id
        }
      }));

      const workflowData = {
        name: workflowName,
        description: currentWorkflow.description,
        nodes: syncedNodes,
        edges
      };
      
      const response = await fetch(`http://localhost:3001/api/workflows/${currentWorkflow.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(workflowData)
      });
      
      if (response.ok) {
        const updated = await response.json();
        setCurrentWorkflow(updated.workflow);
        alert('Workflow saved successfully!');
      } else {
        alert('Failed to save workflow');
      }
    } catch (error) {
      console.error('Error saving workflow:', error);
      alert('Error saving workflow');
    }
    setShowSaveMenu(false);
  }, [currentWorkflow, workflowName, nodes, edges]);

  const handleSaveAs = useCallback(async () => {
    try {
      const workflowData = {
        name: saveAsName || 'New Workflow',
        description: saveAsDescription || '',
        nodes,
        edges
      };
      
      const response = await fetch('http://localhost:3001/api/workflows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(workflowData)
      });
      
      if (response.ok) {
        const data = await response.json();
        const newWorkflow = data.workflow;
        
        // Sync workflowId in all nodes to match the newly created workflow
        const syncedNodes = nodes.map(node => ({
          ...node,
          data: {
            ...node.data,
            workflowId: newWorkflow.id
          }
        }));
        
        // Update the newly created workflow with synced nodes
        await fetch(`http://localhost:3001/api/workflows/${newWorkflow.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...workflowData,
            nodes: syncedNodes
          })
        });
        
        // Update workflows list
        setWorkflows(prev => [...prev, newWorkflow]);
        
        // Load the new workflow
        loadWorkflow(newWorkflow);
        
        alert('Workflow created successfully!');
        setShowSaveAsDialog(false);
        setSaveAsName('');
        setSaveAsDescription('');
      } else {
        alert('Failed to create workflow');
      }
    } catch (error) {
      console.error('Error creating workflow:', error);
      alert('Error creating workflow');
    }
  }, [saveAsName, saveAsDescription, nodes, edges, loadWorkflow]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-screen h-screen">
      {/* Top Header Bar */}
      <div className="absolute top-0 left-0 right-0 z-50 bg-white border-b shadow-sm">
        <div className="flex items-center justify-between px-4 py-2">
          <div className="flex items-center gap-2">
            {/* New Button */}
            <Button
              onClick={newWorkflow}
              variant="outline"
              size="sm"
              className="w-8 h-8 p-0"
              title="New Workflow"
            >
              <Plus className="w-4 h-4" />
            </Button>

            {/* Load Dropdown */}
            <div className="relative">
              <Button
                onClick={() => setShowLoadMenu(!showLoadMenu)}
                variant="outline"
                size="sm"
                className="w-8 h-8 p-0"
                title="Load Workflow"
              >
                <FolderOpen className="w-4 h-4" />
              </Button>
              {showLoadMenu && (
                <div className="absolute top-full left-0 mt-1 bg-white border rounded-md shadow-lg w-64 max-h-80 overflow-y-auto">
                  {workflows.length > 0 ? (
                    workflows.map(workflow => (
                      <button
                        key={workflow.id}
                        onClick={() => loadWorkflow(workflow)}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 border-b last:border-b-0"
                      >
                        <div className="font-medium">{workflow.name}</div>
                        <div className="text-xs text-gray-500">
                          {workflow.nodes?.length || 0} nodes
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-3 text-sm text-gray-500">
                      No workflows found
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Save Dropdown */}
            <div className="relative">
              <Button
                onClick={() => setShowSaveMenu(!showSaveMenu)}
                variant="outline"
                size="sm"
                className="w-8 h-8 p-0"
                title="Save"
              >
                <Save className="w-4 h-4" />
              </Button>
              {showSaveMenu && (
                <div className="absolute top-full left-0 mt-1 bg-white border rounded-md shadow-lg w-32">
                  <button
                    onClick={saveWorkflow}
                    disabled={!currentWorkflow}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 border-b disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setShowSaveAsDialog(true);
                      setShowSaveMenu(false);
                      setSaveAsName(workflowName);
                      setSaveAsDescription(currentWorkflow?.description || '');
                    }}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100"
                  >
                    Save As
                  </button>
                </div>
              )}
            </div>

            {/* Workflow Name */}
            {isEditingName ? (
              <input
                ref={nameInputRef}
                type="text"
                value={workflowName}
                onChange={(e) => setWorkflowName(e.target.value)}
                onBlur={() => setIsEditingName(false)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') setIsEditingName(false);
                  if (e.key === 'Escape') {
                    setWorkflowName(currentWorkflow?.name || 'Untitled Workflow');
                    setIsEditingName(false);
                  }
                }}
                className="px-2 py-1 text-sm font-medium border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            ) : (
              <div
                onClick={() => setIsEditingName(true)}
                className="px-2 py-1 text-sm font-medium cursor-pointer hover:bg-gray-100 rounded"
                title="Click to edit"
              >
                {workflowName}
              </div>
            )}
          </div>

          {/* Node Count */}
          <div className="text-sm text-gray-600">
            {nodes.length} {nodes.length === 1 ? 'node' : 'nodes'}
          </div>
        </div>
      </div>

      {/* Save As Dialog */}
      {showSaveAsDialog && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-xl p-6 w-96">
            <h3 className="text-lg font-semibold mb-4">Save Workflow As</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input
                  type="text"
                  value={saveAsName}
                  onChange={(e) => setSaveAsName(e.target.value)}
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter workflow name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  value={saveAsDescription}
                  onChange={(e) => setSaveAsDescription(e.target.value)}
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="3"
                  placeholder="Enter description (optional)"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button
                  onClick={() => {
                    setShowSaveAsDialog(false);
                    setSaveAsName('');
                    setSaveAsDescription('');
                  }}
                  variant="outline"
                  size="sm"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveAs}
                  size="sm"
                  disabled={!saveAsName.trim()}
                >
                  Save
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Node Palette */}
      <Card className="absolute top-16 right-2.5 z-50">
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

      <ReactFlowProvider>
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
          fitViewOptions={{
            padding: 0.2,
            maxZoom: window.innerWidth < 768 ? 1 : 1.5,
            minZoom: window.innerWidth < 768 ? 0.3 : 0.5,
          }}
          minZoom={window.innerWidth < 768 ? 0.3 : 0.5}
          maxZoom={window.innerWidth < 768 ? 1 : 1.5}
          defaultViewport={{ x: 0, y: 0, zoom: window.innerWidth < 768 ? 0.5 : 1 }}
          className="mt-12"
        >
          <Controls />
          <MiniMap />
          <ViewportAdjuster nodeCount={nodes.length} />
        
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
      </ReactFlowProvider>
    </div>
  );
}
