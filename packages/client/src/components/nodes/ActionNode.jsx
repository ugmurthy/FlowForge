import React from 'react';
import { Handle, Position } from '@xyflow/react';

export default function ActionNode({ data }) {
  return (
    <div style={{
      padding: '10px',
      borderRadius: '8px',
      background: '#e8f5e8',
      border: '2px solid #4caf50',
      minWidth: '150px',
      textAlign: 'center'
    }}>
      <div style={{ fontWeight: 'bold', color: '#388e3c', fontSize: '12px' }}>
        ACTION
      </div>
      <div style={{ marginTop: '5px', fontSize: '14px' }}>
        {data.label}
      </div>
      <Handle
        type="target"
        position={Position.Left}
        style={{ background: '#4caf50' }}
      />
      <Handle
        type="source"
        position={Position.Right}
        style={{ background: '#4caf50' }}
      />
    </div>
  );
}
