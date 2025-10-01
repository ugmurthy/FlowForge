import React from 'react';
import { Handle, Position } from '@xyflow/react';

export default function OllamaNode({ data }) {
  return (
    <div className="p-3 rounded-lg bg-indigo-50 border-2 border-indigo-500 min-w-[150px] text-center">
      <div className="font-bold text-indigo-700 text-xs uppercase tracking-wide">
        Ollama
      </div>
      <div className="mt-1 text-sm text-gray-800">
        {data.label}
      </div>
      <Handle
        type="target"
        position={Position.Left}
        className="!bg-indigo-500"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!bg-indigo-500"
      />
    </div>
  );
}
