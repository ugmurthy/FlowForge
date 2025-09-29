import axios from 'axios';
import { NodeExecutor, ExecutionContext } from '../types/workflow.js';

export class OpenRouterNodeExecutor implements NodeExecutor {
  async execute(context: ExecutionContext, nodeData: any): Promise<any> {
    const config = nodeData.config || {};
    const apiKey = config.apiKey || process.env.OPENROUTER_API_KEY;
    const model = config.model || 'openai/gpt-3.5-turbo';
    const prompt = config.prompt || '';
    const maxTokens = config.maxTokens || 1000;
    const temperature = config.temperature || 0.7;

    // Debug logging (remove in production)
    if (process.env.NODE_ENV === 'development') {
      console.log('OpenRouter AI Node - Model:', model);
      console.log('OpenRouter AI Node - API Key available:', !!apiKey);
      console.log('OpenRouter AI Node - Original Prompt:', prompt);
      console.log('OpenRouter AI Node - Context Data:', JSON.stringify(context.data, null, 2));
    }
    
    if (!apiKey) {
      throw new Error('OpenRouter API key is required');
    }

    if (!prompt) {
      throw new Error('Prompt is required for AI node');
    }

    // Replace variables in prompt with context data
    let processedPrompt = prompt;
    
    // Simple variable replacement: ${variableName}
    const variables = prompt.match(/\${([^}]+)}/g) || [];
    for (const variable of variables) {
      const varName = variable.slice(2, -1); // Remove ${ and }
      const value = this.getNestedValue(context.data, varName) || '';
      processedPrompt = processedPrompt.replace(variable, String(value));
      
      // Debug variable replacement
      if (process.env.NODE_ENV === 'development') {
        console.log(`Variable replacement: ${variable} -> "${value}"`);
      }
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('OpenRouter AI Node - Model:', model);
      console.log('OpenRouter AI Node - API Key available:', !!apiKey);
      console.log('OpenRouter AI Node - Context Data:', JSON.stringify(context.data, null, 2));
      console.log('OpenRouter AI Node - Processed Prompt:', processedPrompt);
    }
    try {
      const response = await axios.post(
        'https://openrouter.ai/api/v1/chat/completions',
        {
          model,
          messages: [
            {
              role: 'user',
              content: processedPrompt
            }
          ],
          max_tokens: maxTokens,
          temperature,
          stream: false
        },
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://github.com/ugmurthy/FlowForge',
            'X-Title': 'FlowForge'
          }
        }
      );

      const aiResponse = response.data.choices[0]?.message?.content || '';
      const usage = response.data.usage || {};

      return {
        response: aiResponse,
        model,
        usage,
        prompt: processedPrompt,
        success: true
      };

    } catch (error: any) {
      if (error.response) {
        throw new Error(`OpenRouter API error: ${error.response.status} - ${error.response.data?.error?.message || error.response.statusText}`);
      }
      throw new Error(`OpenRouter request failed: ${error.message}`);
    }
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined;
    }, obj);
  }
}

export const openRouterNodeExecutor = new OpenRouterNodeExecutor();
