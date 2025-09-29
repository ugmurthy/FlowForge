import React from 'react';
import { Handle, Position } from '@xyflow/react';

export default function ConditionNode({ data }) {
  return (
    <div style={{
      padding: '10px',
      borderRadius: '8px',
      background: '#fff3e0',
      border: '2px solid #ff9800',
      minWidth: '150px',
      textAlign: 'center'
    }}>
      <div style={{ fontWeight: 'bold', color: '#f57c00', fontSize: '12px' }}>
        CONDITION
      </div>
      <div style={{ marginTop: '5px', fontSize: '14px' }}>
        {data.label}
      </div>
      <Handle
        type="target"
        position={Position.Left}
        style={{ background: '#ff9800' }}
      />
      <Handle
        type="source"
        position={Position.Right}
        style={{ background: '#ff9800' }}
        id="true"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        style={{ background: '#ff9800' }}
        id="false"
      />
    </div>
  );
}
