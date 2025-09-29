import React from 'react';
import { Handle, Position } from '@xyflow/react';

export default function AiNode({ data }) {
  return (
    <div style={{
      padding: '10px',
      borderRadius: '8px',
      background: '#e1f5fe',
      border: '2px solid #00bcd4',
      minWidth: '150px',
      textAlign: 'center'
    }}>
      <div style={{ fontWeight: 'bold', color: '#0097a7', fontSize: '12px' }}>
        AI
      </div>
      <div style={{ marginTop: '5px', fontSize: '14px' }}>
        {data.label}
      </div>
      <Handle
        type="target"
        position={Position.Left}
        style={{ background: '#00bcd4' }}
      />
      <Handle
        type="source"
        position={Position.Right}
        style={{ background: '#00bcd4' }}
      />
    </div>
  );
}
