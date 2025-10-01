import axios from 'axios';
import { NodeExecutor, ExecutionContext } from '../types/workflow.js';
import { replaceVariables } from '../utils/variable-utils.js';

export class HttpNodeExecutor implements NodeExecutor {
  async execute(context: ExecutionContext, nodeData: any): Promise<any> {
    const config = nodeData.config || {};
    const method = (config.method || 'GET').toUpperCase();
    const urlTemplate = config.url || '';
    const headers = config.headers || {};
    const timeout = config.timeout || 30000;

    if (!urlTemplate) {
      throw new Error('HTTP node requires a URL');
    }

    // Replace variables in URL with context data
    const url = replaceVariables(urlTemplate, context.data);

    try {
      // Process headers with variable replacement
      const processedHeaders: any = { 'User-Agent': 'FlowForge/1.0' };
      for (const [key, value] of Object.entries(headers)) {
        if (typeof value === 'string') {
          processedHeaders[key] = replaceVariables(value, context.data);
        } else {
          processedHeaders[key] = value;
        }
      }

      let requestConfig: any = {
        method,
        url,
        headers: processedHeaders,
        timeout
      };

      // Add request body for POST/PUT/PATCH
      if (['POST', 'PUT', 'PATCH'].includes(method)) {
        const body = config.body || nodeData.inputs || {};
        
        // Process body with variable replacement if it's a string
        if (typeof body === 'string') {
          requestConfig.data = replaceVariables(body, context.data);
        } else {
          requestConfig.data = body;
        }
        
        // Set content type if not specified
        if (!requestConfig.headers['Content-Type']) {
          requestConfig.headers['Content-Type'] = 'application/json';
        }
      }

      // Add query parameters for GET requests
      if (method === 'GET' && config.params) {
        requestConfig.params = config.params;
      }

      const response = await axios(requestConfig);

      return {
        statusCode: response.status,
        statusText: response.statusText,
        headers: response.headers,
        data: response.data,
        success: true
      };

    } catch (error: any) {
      // Handle axios errors
      if (error.response) {
        return {
          statusCode: error.response.status,
          statusText: error.response.statusText,
          headers: error.response.headers,
          data: error.response.data,
          error: error.message,
          success: false
        };
      }

      throw new Error(`HTTP request failed: ${error.message}`);
    }
  }
}

export const httpNodeExecutor = new HttpNodeExecutor();
