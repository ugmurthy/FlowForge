import React from 'react';
import { Handle, Position } from '@xyflow/react';

export default function AiNode({ data }) {
  return (
    <div style={{
      padding: '10px',
      borderRadius: '8px',
      background: '#f3e5f5',
      border: '2px solid #9c27b0',
      minWidth: '150px',
      textAlign: 'center'
    }}>
      <div style={{ fontWeight: 'bold', color: '#7b1fa2', fontSize: '12px' }}>
        AI
      </div>
      <div style={{ marginTop: '5px', fontSize: '14px' }}>
        {data.label}
      </div>
      <Handle
        type="target"
        position={Position.Left}
        style={{ background: '#9c27b0' }}
      />
      <Handle
        type="source"
        position={Position.Right}
        style={{ background: '#9c27b0' }}
      />
    </div>
  );
}
