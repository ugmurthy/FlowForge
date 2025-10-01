import React, { useState } from 'react';
import { Handle, Position, useReactFlow } from '@xyflow/react';
import { Play, Loader2 } from 'lucide-react';

export default function TriggerNode({ data }) {
  const [executing, setExecuting] = useState(false);
  const [result, setResult] = useState(null);
  const reactFlowInstance = useReactFlow();

  const executeWorkflow = async () => {
    if (!data.workflowId) {
      console.error('No workflow ID available');
      return;
    }

    setExecuting(true);
    setResult(null);

    try {
      const response = await fetch(`http://localhost:3001/api/workflows/${data.workflowId}/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputData: data.inputData || {}
        })
      });

      const resultData = await response.json();
      setResult(response.ok ? 'success' : 'error');
      
      if (response.ok) {
        console.log('Workflow executed successfully:', resultData);
      } else {
        console.error('Workflow execution failed:', resultData);
      }
    } catch (error) {
      console.error('Failed to execute workflow:', error);
      setResult('error');
    } finally {
      setTimeout(() => {
        setExecuting(false);
        setResult(null);
      }, 2000);
    }
  };

  return (
    <div className="p-3 rounded-lg bg-blue-50 border-2 border-blue-500 min-w-[150px]">
      <div className="font-bold text-blue-700 text-xs uppercase tracking-wide text-center">
        TRIGGER
      </div>
      <div className="mt-1 text-sm text-gray-800 text-center">
        {data.label}
      </div>
      <div className="mt-2 flex justify-center">
        <button
          onClick={executeWorkflow}
          disabled={executing || !data.workflowId}
          className={`
            flex items-center gap-1 px-3 py-1 rounded text-xs font-medium transition-colors
            ${executing 
              ? 'bg-gray-400 text-white cursor-not-allowed' 
              : result === 'success'
              ? 'bg-green-500 text-white'
              : result === 'error'
              ? 'bg-red-500 text-white'
              : 'bg-blue-600 text-white hover:bg-blue-700'
            }
            ${!data.workflowId ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          {executing ? (
            <>
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>Running...</span>
            </>
          ) : result === 'success' ? (
            <span>Success!</span>
          ) : result === 'error' ? (
            <span>Failed</span>
          ) : (
            <>
              <Play className="w-3 h-3" />
              <span>Execute</span>
            </>
          )}
        </button>
      </div>
      <Handle
        type="source"
        position={Position.Right}
        className="!bg-blue-500"
      />
    </div>
  );
}
