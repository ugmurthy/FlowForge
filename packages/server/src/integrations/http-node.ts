import axios from 'axios';
import { NodeExecutor, ExecutionContext } from '../types/workflow.js';

export class HttpNodeExecutor implements NodeExecutor {
  async execute(context: ExecutionContext, nodeData: any): Promise<any> {
    const config = nodeData.config || {};
    const method = (config.method || 'GET').toUpperCase();
    const url = config.url || '';
    const headers = config.headers || {};
    const timeout = config.timeout || 30000;

    if (!url) {
      throw new Error('HTTP node requires a URL');
    }

    try {
      let requestConfig: any = {
        method,
        url,
        headers: {
          'User-Agent': 'FlowForge/1.0',
          ...headers
        },
        timeout
      };

      // Add request body for POST/PUT/PATCH
      if (['POST', 'PUT', 'PATCH'].includes(method)) {
        requestConfig.data = config.body || nodeData.inputs || {};
        
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
