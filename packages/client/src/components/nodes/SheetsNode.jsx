import React from 'react';
import { Handle, Position } from '@xyflow/react';

export default function SheetsNode({ data }) {
  return (
    <div className="p-3 rounded-lg bg-emerald-50 border-2 border-emerald-500 min-w-[150px] text-center">
      <div className="font-bold text-emerald-700 text-xs uppercase tracking-wide">
        SHEETS
      </div>
      <div className="mt-1 text-sm text-gray-800">
        {data.label}
      </div>
      <Handle
        type="target"
        position={Position.Left}
        className="!bg-emerald-500"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!bg-emerald-500"
      />
    </div>
  );
}
