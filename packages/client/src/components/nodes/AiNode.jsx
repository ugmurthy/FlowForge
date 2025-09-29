import React from 'react';
import { Handle, Position } from '@xyflow/react';

export default function AiNode({ data }) {
  return (
    <div className="p-3 rounded-lg bg-purple-50 border-2 border-purple-500 min-w-[150px] text-center">
      <div className="font-bold text-purple-700 text-xs uppercase tracking-wide">
        AI
      </div>
      <div className="mt-1 text-sm text-gray-800">
        {data.label}
      </div>
      <Handle
        type="target"
        position={Position.Left}
        className="!bg-purple-500"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!bg-purple-500"
      />
    </div>
  );
}
