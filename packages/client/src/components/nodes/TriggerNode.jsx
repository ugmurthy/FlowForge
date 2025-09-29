import React from 'react';
import { Handle, Position } from '@xyflow/react';

export default function TriggerNode({ data }) {
  return (
    <div className="p-3 rounded-lg bg-blue-50 border-2 border-blue-500 min-w-[150px] text-center">
      <div className="font-bold text-blue-700 text-xs uppercase tracking-wide">
        TRIGGER
      </div>
      <div className="mt-1 text-sm text-gray-800">
        {data.label}
      </div>
      <Handle
        type="source"
        position={Position.Right}
        className="!bg-blue-500"
      />
    </div>
  );
}
