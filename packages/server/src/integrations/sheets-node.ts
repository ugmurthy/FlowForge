import axios from 'axios';
import { NodeExecutor, ExecutionContext } from '../types/workflow.js';

export class SheetsNodeExecutor implements NodeExecutor {
  async execute(context: ExecutionContext, nodeData: any): Promise<any> {
    const config = nodeData.config || {};
    const action = config.action || 'append'; // append, read, update
    const spreadsheetId = config.spreadsheetId || '';
    const range = config.range || 'Sheet1!A:Z';
    const apiKey = config.apiKey || process.env.GOOGLE_SHEETS_API_KEY;
    const values = config.values || nodeData.inputs || [];

    if (!spreadsheetId) {
      throw new Error('Google Sheets spreadsheet ID is required');
    }

    if (!apiKey) {
      throw new Error('Google Sheets API key is required');
    }

    const baseUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`;

    try {
      switch (action) {
        case 'read':
          return await this.readSheet(baseUrl, range, apiKey);
        
        case 'append':
          return await this.appendToSheet(baseUrl, range, values, apiKey, context.data);
        
        case 'update':
          return await this.updateSheet(baseUrl, range, values, apiKey, context.data);
        
        default:
          throw new Error(`Unsupported action: ${action}`);
      }
    } catch (error: any) {
      if (error.response) {
        throw new Error(`Google Sheets API error: ${error.response.status} - ${error.response.data?.error?.message || error.response.statusText}`);
      }
      throw new Error(`Google Sheets operation failed: ${error.message}`);
    }
  }

  private async readSheet(baseUrl: string, range: string, apiKey: string) {
    const response = await axios.get(`${baseUrl}/values/${range}`, {
      params: { key: apiKey }
    });

    return {
      success: true,
      action: 'read',
      range,
      values: response.data.values || [],
      majorDimension: response.data.majorDimension
    };
  }

  private async appendToSheet(baseUrl: string, range: string, values: any[], apiKey: string, contextData: any) {
    // Process values to replace variables
    const processedValues = this.processValues(values, contextData);

    const response = await axios.post(
      `${baseUrl}/values/${range}:append`,
      {
        values: Array.isArray(processedValues[0]) ? processedValues : [processedValues],
        majorDimension: 'ROWS'
      },
      {
        params: {
          key: apiKey,
          valueInputOption: 'USER_ENTERED'
        },
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    return {
      success: true,
      action: 'append',
      range,
      updates: response.data.updates,
      updatedRows: response.data.updates?.updatedRows || 0
    };
  }

  private async updateSheet(baseUrl: string, range: string, values: any[], apiKey: string, contextData: any) {
    const processedValues = this.processValues(values, contextData);

    const response = await axios.put(
      `${baseUrl}/values/${range}`,
      {
        values: Array.isArray(processedValues[0]) ? processedValues : [processedValues],
        majorDimension: 'ROWS'
      },
      {
        params: {
          key: apiKey,
          valueInputOption: 'USER_ENTERED'
        },
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    return {
      success: true,
      action: 'update',
      range,
      updatedRows: response.data.updatedRows,
      updatedColumns: response.data.updatedColumns,
      updatedCells: response.data.updatedCells
    };
  }

  private processValues(values: any[], contextData: any): any[] {
    if (!Array.isArray(values)) return values;

    return values.map(row => {
      if (Array.isArray(row)) {
        return row.map(cell => this.replaceVariables(String(cell), contextData));
      } else {
        return this.replaceVariables(String(row), contextData);
      }
    });
  }

  private replaceVariables(text: string, data: any): string {
    let processedText = text;
    const variables = text.match(/\${([^}]+)}/g) || [];
    
    for (const variable of variables) {
      const varName = variable.slice(2, -1);
      const value = this.getNestedValue(data, varName) || '';
      processedText = processedText.replace(variable, String(value));
    }
    
    return processedText;
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined;
    }, obj);
  }
}

export const sheetsNodeExecutor = new SheetsNodeExecutor();
