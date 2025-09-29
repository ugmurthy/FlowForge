import React from 'react';
import { Handle, Position } from '@xyflow/react';

export default function SlackNode({ data }) {
  return (
    <div style={{
      padding: '10px',
      borderRadius: '8px',
      background: '#ede7f6',
      border: '2px solid #673ab7',
      minWidth: '150px',
      textAlign: 'center'
    }}>
      <div style={{ fontWeight: 'bold', color: '#512da8', fontSize: '12px' }}>
        SLACK
      </div>
      <div style={{ marginTop: '5px', fontSize: '14px' }}>
        {data.label}
      </div>
      <Handle
        type="target"
        position={Position.Left}
        style={{ background: '#673ab7' }}
      />
      <Handle
        type="source"
        position={Position.Right}
        style={{ background: '#673ab7' }}
      />
    </div>
  );
}
