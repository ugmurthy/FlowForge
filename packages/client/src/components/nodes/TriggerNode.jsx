import React from 'react';
import { Handle, Position } from '@xyflow/react';

export default function TriggerNode({ data }) {
  return (
    <div style={{
      padding: '10px',
      borderRadius: '8px',
      background: '#e3f2fd',
      border: '2px solid #2196f3',
      minWidth: '150px',
      textAlign: 'center'
    }}>
      <div style={{ fontWeight: 'bold', color: '#1976d2', fontSize: '12px' }}>
        TRIGGER
      </div>
      <div style={{ marginTop: '5px', fontSize: '14px' }}>
        {data.label}
      </div>
      <Handle
        type="source"
        position={Position.Right}
        style={{ background: '#2196f3' }}
      />
    </div>
  );
}
