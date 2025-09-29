import React from 'react';
import { Handle, Position } from '@xyflow/react';

export default function ConditionNode({ data }) {
  return (
    <div className="p-3 rounded-lg bg-orange-50 border-2 border-orange-500 min-w-[150px] text-center">
      <div className="font-bold text-orange-700 text-xs uppercase tracking-wide">
        CONDITION
      </div>
      <div className="mt-1 text-sm text-gray-800">
        {data.label}
      </div>
      <Handle
        type="target"
        position={Position.Left}
        className="!bg-orange-500"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!bg-orange-500"
        id="true"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-orange-500"
        id="false"
      />
    </div>
  );
}
