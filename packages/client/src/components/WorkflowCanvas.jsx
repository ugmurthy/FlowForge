import React, { useCallback, useState } from 'react';
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

const initialNodes = [
  {
    id: '1',
    type: 'trigger',
    position: { x: 250, y: 25 },
    data: { label: 'HTTP Trigger' },
  },
];

const initialEdges = [];

export default function WorkflowCanvas() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    [setEdges],
  );

  const addNode = useCallback((type) => {
    const newNode = {
      id: `${nodes.length + 1}`,
      type,
      position: {
        x: Math.random() * 400,
        y: Math.random() * 400,
      },
      data: { label: `${type.charAt(0).toUpperCase() + type.slice(1)} Node` },
    };
    setNodes((nds) => nds.concat(newNode));
  }, [nodes.length, setNodes]);

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
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
