import React from 'react';
import { Handle, Position } from '@xyflow/react';

export default function SlackNode({ data }) {
  return (
    <div className="p-3 rounded-lg bg-teal-50 border-2 border-teal-500 min-w-[150px] text-center">
      <div className="font-bold text-teal-700 text-xs uppercase tracking-wide">
        SLACK
      </div>
      <div className="mt-1 text-sm text-gray-800">
        {data.label}
      </div>
      <Handle
        type="target"
        position={Position.Left}
        className="!bg-teal-500"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!bg-teal-500"
      />
    </div>
  );
}
