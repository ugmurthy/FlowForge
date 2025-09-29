import React from 'react';
import { Handle, Position } from '@xyflow/react';

export default function EmailNode({ data }) {
  return (
    <div style={{
      padding: '10px',
      borderRadius: '8px',
      background: '#fce4ec',
      border: '2px solid #e91e63',
      minWidth: '150px',
      textAlign: 'center'
    }}>
      <div style={{ fontWeight: 'bold', color: '#c2185b', fontSize: '12px' }}>
        EMAIL
      </div>
      <div style={{ marginTop: '5px', fontSize: '14px' }}>
        {data.label}
      </div>
      <Handle
        type="target"
        position={Position.Left}
        style={{ background: '#e91e63' }}
      />
      <Handle
        type="source"
        position={Position.Right}
        style={{ background: '#e91e63' }}
      />
    </div>
  );
}
