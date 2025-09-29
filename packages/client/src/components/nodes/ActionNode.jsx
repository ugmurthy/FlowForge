import React from 'react';
import { Handle, Position } from '@xyflow/react';

export default function ActionNode({ data }) {
  return (
    <div className="p-3 rounded-lg bg-green-50 border-2 border-green-500 min-w-[150px] text-center">
      <div className="font-bold text-green-700 text-xs uppercase tracking-wide">
        ACTION
      </div>
      <div className="mt-1 text-sm text-gray-800">
        {data.label}
      </div>
      <Handle
        type="target"
        position={Position.Left}
        className="!bg-green-500"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!bg-green-500"
      />
    </div>
  );
}
