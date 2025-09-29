import React from 'react';
import { Handle, Position } from '@xyflow/react';

export default function EmailNode({ data }) {
  return (
    <div className="p-3 rounded-lg bg-rose-50 border-2 border-rose-500 min-w-[150px] text-center">
      <div className="font-bold text-rose-700 text-xs uppercase tracking-wide">
        EMAIL
      </div>
      <div className="mt-1 text-sm text-gray-800">
        {data.label}
      </div>
      <Handle
        type="target"
        position={Position.Left}
        className="!bg-rose-500"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!bg-rose-500"
      />
    </div>
  );
}
