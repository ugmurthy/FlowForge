import axios from 'axios';
import { NodeExecutor, ExecutionContext } from '../types/workflow.js';
import { getNestedValue } from '../utils/variable-utils.js';

export class OllamaNodeExecutor implements NodeExecutor {
  async execute(context: ExecutionContext, nodeData: any): Promise<any> {
    const config = nodeData.config || {};
    const baseUrl = config.baseUrl || process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
    const model = config.model || 'gpt-oss:20b';
    const systemPrompt = config.systemPrompt || 'You are a helpful assistant';
    const prompt = config.prompt || '';
    const temperature = config.temperature || 0.7;
    const stream = config.stream || false;

    if (!prompt) {
      throw new Error('Prompt is required for Ollama AI node');
    }

    // Replace variables in prompt with context data
    let processedPrompt = prompt;
    
    // Simple variable replacement: ${variableName}
    const variables = prompt.match(/\${([^}]+)}/g) || [];
    for (const variable of variables) {
      const varName = variable.slice(2, -1); // Remove ${ and }
      const value = getNestedValue(context.data, varName);
      let replacement: string;

      if (value === undefined) {
        replacement = '';
      } else if (typeof value === 'object' && value !== null) {
        // Pretty-print JSON so the LLM can parse it
        replacement = JSON.stringify(value, null, 2);
      } else {
        replacement = String(value);
      }

      // Replace all occurrences of this variable
      processedPrompt = processedPrompt.split(variable).join(replacement);
      
      // Debug variable replacement
      if (process.env.NODE_ENV === 'development') {
        const preview = replacement.slice(0, 200) + (replacement.length > 200 ? '...' : '');
        console.log(`Variable replacement: ${variable} -> ${preview}`);
      }
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('Ollama AI Node - Base URL:', baseUrl);
      console.log('Ollama AI Node - Model:', model);
      console.log('Ollama AI Node - Context Data:', JSON.stringify(context.data, null, 2));
      console.log('Ollama AI Node - Processed Prompt:', processedPrompt);
    }

    try {
      const response = await axios.post(
        `${baseUrl}/api/chat`,
        {
          model,
          messages: [
            {
              role: 'system',
              content: systemPrompt
            },
            {
              role: 'user',
              content: processedPrompt
            }
          ],
          stream,
          options: {
            temperature
          }
        },
        {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 300000 // 5 minutes timeout for local models
        }
      );

      const aiResponse = response.data.message?.content || '';
      const metadata = {
        model: response.data.model || model,
        created_at: response.data.created_at,
        done: response.data.done,
        total_duration: response.data.total_duration,
        load_duration: response.data.load_duration,
        prompt_eval_count: response.data.prompt_eval_count,
        eval_count: response.data.eval_count
      };

      return {
        response: aiResponse,
        model: metadata.model,
        metadata,
        prompt: processedPrompt,
        success: true
      };

    } catch (error: any) {
      if (error.code === 'ECONNREFUSED') {
        throw new Error(`Cannot connect to Ollama at ${baseUrl}. Make sure Ollama is running.`);
      }
      if (error.response) {
        throw new Error(`Ollama API error: ${error.response.status} - ${error.response.data?.error || error.response.statusText}`);
      }
      throw new Error(`Ollama request failed: ${error.message}`);
    }
  }
}

export const ollamaNodeExecutor = new OllamaNodeExecutor();
