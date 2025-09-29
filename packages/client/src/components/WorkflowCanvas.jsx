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

import TriggerNode from './nodes/TriggerNode';
import ActionNode from './nodes/ActionNode';
import ConditionNode from './nodes/ConditionNode';
import HttpNode from './nodes/HttpNode';
import AiNode from './nodes/AiNode';
import SlackNode from './nodes/SlackNode';
import EmailNode from './nodes/EmailNode';
import SheetsNode from './nodes/SheetsNode';

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
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div>Loading workflows...</div>
      </div>
    );
  }

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      {/* Workflow Selector */}
      <div style={{
        position: 'absolute',
        top: 10,
        right: 10,
        zIndex: 1000,
        background: 'white',
        padding: '10px',
        borderRadius: '8px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        minWidth: '250px'
      }}>
        <h3 style={{ margin: '0 0 10px 0', fontSize: '14px' }}>
          Current Workflow: {currentWorkflow?.name || 'None'}
        </h3>
        
        {workflows.length > 0 && (
          <div style={{ marginBottom: '10px' }}>
            <select 
              value={currentWorkflow?.id || ''} 
              onChange={(e) => {
                const selected = workflows.find(w => w.id === e.target.value);
                if (selected) loadWorkflow(selected);
              }}
              style={{ width: '100%', padding: '5px', fontSize: '12px' }}
            >
              <option value="">Select a workflow...</option>
              {workflows.map(workflow => (
                <option key={workflow.id} value={workflow.id}>
                  {workflow.name} ({workflow.nodes.length} nodes)
                </option>
              ))}
            </select>
          </div>
        )}
        
        {currentWorkflow && (
          <div>
            <button 
              onClick={saveWorkflow} 
              style={{...buttonStyle, background: '#4CAF50', color: 'white', marginBottom: '5px'}}
            >
              💾 Save Workflow
            </button>
            <div style={{ fontSize: '11px', color: '#666', marginBottom: '10px' }}>
              ID: {currentWorkflow.id.slice(0, 8)}...
            </div>
          </div>
        )}
        
        {workflows.length === 0 && (
          <div style={{ fontSize: '12px', color: '#666' }}>
            No workflows found. Create one using the test scripts!
          </div>
        )}
      </div>

      {/* Node Palette */}
      <div style={{
        position: 'absolute',
        top: 10,
        left: 10,
        zIndex: 1000,
        background: 'white',
        padding: '10px',
        borderRadius: '8px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
      }}>
        <h3 style={{ margin: '0 0 10px 0', fontSize: '14px' }}>Add Nodes</h3>
        <button onClick={() => addNode('trigger')} style={buttonStyle}>
          Trigger
        </button>
        <button onClick={() => addNode('action')} style={buttonStyle}>
          Action
        </button>
        <button onClick={() => addNode('condition')} style={buttonStyle}>
          Condition
        </button>
        <hr style={{ margin: '10px 0', border: '1px solid #eee' }} />
        <button onClick={() => addNode('http')} style={buttonStyle}>
          HTTP
        </button>
        <button onClick={() => addNode('ai')} style={buttonStyle}>
          AI
        </button>
        <button onClick={() => addNode('slack')} style={buttonStyle}>
          Slack
        </button>
        <button onClick={() => addNode('email')} style={buttonStyle}>
          Email
        </button>
        <button onClick={() => addNode('sheets')} style={buttonStyle}>
          Sheets
        </button>
      </div>

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

const buttonStyle = {
  display: 'block',
  width: '100%',
  margin: '5px 0',
  padding: '8px 12px',
  border: '1px solid #ddd',
  borderRadius: '4px',
  background: 'white',
  cursor: 'pointer',
  fontSize: '12px'
};
