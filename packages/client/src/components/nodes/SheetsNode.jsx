import React from 'react';
import { Handle, Position } from '@xyflow/react';

export default function SheetsNode({ data }) {
  return (
    <div style={{
      padding: '10px',
      borderRadius: '8px',
      background: '#f1f8e9',
      border: '2px solid #8bc34a',
      minWidth: '150px',
      textAlign: 'center'
    }}>
      <div style={{ fontWeight: 'bold', color: '#689f38', fontSize: '12px' }}>
        SHEETS
      </div>
      <div style={{ marginTop: '5px', fontSize: '14px' }}>
        {data.label}
      </div>
      <Handle
        type="target"
        position={Position.Left}
        style={{ background: '#8bc34a' }}
      />
      <Handle
        type="source"
        position={Position.Right}
        style={{ background: '#8bc34a' }}
      />
    </div>
  );
}
