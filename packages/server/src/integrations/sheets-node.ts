import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';
import { NodeExecutor, ExecutionContext } from '../types/workflow.js';
import { getNestedValue, replaceVariables } from '../utils/variable-utils.js';

interface ServiceAccountConfig {
  client_email: string;
  private_key: string;
}

export class SheetsNodeExecutor implements NodeExecutor {
  async execute(context: ExecutionContext, nodeData: any): Promise<any> {
    const config = nodeData.config || {};
    const operation = config.operation || config.action || 'append';
    const action = operation === 'appendRow' ? 'append' : operation;
    const spreadsheetId = config.spreadsheetId || '';
    const sheetName = config.sheetName || config.range?.split('!')[0] || 'Sheet1';
    const values = config.values || nodeData.inputs || [];

    const serviceAccountJson = config.serviceAccountJson || process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
    
    console.log('🔍 Sheets Node Debug:', { 
      spreadsheetId, 
      hasServiceAccount: !!serviceAccountJson, 
      startsWithTest: spreadsheetId.startsWith('test-') 
    });

    // Mock mode for testing without real credentials
    if (spreadsheetId.startsWith('test-') || !serviceAccountJson) {
      console.log('📊 Sheets Node (Mock Mode):', {
        action,
        spreadsheetId,
        sheetName,
        values: this.processValues(values, context.data),
        message: 'Skipping actual API call - mock spreadsheet or no service account'
      });
      return {
        success: true,
        action,
        sheetName,
        mock: true,
        processedValues: this.processValues(values, context.data),
        message: 'Mock execution - would write to Google Sheets'
      };
    }

    if (!spreadsheetId) {
      throw new Error('Google Sheets spreadsheet ID is required');
    }

    // Parse service account credentials
    let serviceAccount: ServiceAccountConfig;
    try {
      serviceAccount = typeof serviceAccountJson === 'string' 
        ? JSON.parse(serviceAccountJson) 
        : serviceAccountJson;
    } catch (error) {
      throw new Error('Invalid service account JSON format');
    }

    // Initialize JWT auth
    const serviceAccountAuth = new JWT({
      email: serviceAccount.client_email,
      key: serviceAccount.private_key,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    // Initialize GoogleSpreadsheet with auth
    const doc = new GoogleSpreadsheet(spreadsheetId, serviceAccountAuth);

    try {
      console.log('📋 Loading spreadsheet info...');
      await doc.loadInfo();
      console.log(`✅ Spreadsheet loaded: "${doc.title}"`);
      
      // Get the sheet by name or use first sheet
      let sheet = doc.sheetsByTitle[sheetName];
      if (!sheet) {
        sheet = doc.sheetsByIndex[0];
        console.log(`⚠️ Sheet "${sheetName}" not found, using first sheet: "${sheet.title}"`);
      }

      console.log(`🔍 Executing action: ${action} on sheet: "${sheet.title}"`);

      switch (action) {
        case 'read':
          return await this.readSheet(sheet);
        
        case 'append':
          return await this.appendToSheet(sheet, values, context.data);
        
        case 'update':
          return await this.updateSheet(sheet, values, context.data, config.range);
        
        default:
          throw new Error(`Unsupported action: ${action}`);
      }
    } catch (error: any) {
      console.error('❌ Sheets operation error:', {
        message: error.message,
        stack: error.stack,
        response: error.response?.data,
        code: error.code
      });
      
      // More descriptive error messages
      if (error.message?.includes('403') || error.code === 403) {
        throw new Error('Google API error - [403] The caller does not have permission');
      } else if (error.message?.includes('404') || error.code === 404) {
        throw new Error('Google API error - [404] Spreadsheet not found');
      } else if (error.message?.includes('401') || error.code === 401) {
        throw new Error('Google API error - [401] Authentication failed');
      }
      
      throw new Error(`Google Sheets operation failed: ${error.message}`);
    }
  }

  private async readSheet(sheet: any) {
    const rows = await sheet.getRows();
    
    // Convert rows to array format
    const values: any[][] = [];
    
    // Add headers
    if (sheet.headerValues) {
      values.push(sheet.headerValues);
    }
    
    // Add row data
    for (const row of rows) {
      const rowData: any[] = [];
      for (const header of sheet.headerValues || []) {
        rowData.push(row.get(header) || '');
      }
      values.push(rowData);
    }

    return {
      success: true,
      action: 'read',
      sheetName: sheet.title,
      values,
      rowCount: rows.length
    };
  }

  private async appendToSheet(sheet: any, values: any[], contextData: any) {
    const processedValues = this.processValues(values, contextData);
    
    // Ensure we have headers in the sheet
    await sheet.loadHeaderRow();
    const headers = sheet.headerValues || [];
    
    // Convert array values to row objects
    const rowsToAdd = Array.isArray(processedValues[0]) ? processedValues : [processedValues];
    const rowObjects = rowsToAdd.map(rowArray => {
      const rowObj: any = {};
      rowArray.forEach((value: any, index: number) => {
        const header = headers[index] || `Column${index + 1}`;
        rowObj[header] = value;
      });
      return rowObj;
    });

    const addedRows = await sheet.addRows(rowObjects);

    return {
      success: true,
      action: 'append',
      sheetName: sheet.title,
      addedRows: addedRows.length,
      values: processedValues
    };
  }

  private async updateSheet(sheet: any, values: any[], contextData: any, range?: string) {
    const processedValues = this.processValues(values, contextData);
    
    // If range is specified, parse it to determine which rows to update
    let startRow = 0;
    if (range) {
      const rangeMatch = range.match(/!?([A-Z]+)?(\d+)?:?([A-Z]+)?(\d+)?/);
      if (rangeMatch && rangeMatch[2]) {
        startRow = parseInt(rangeMatch[2]) - 1; // Convert to 0-based index
      }
    }

    const rows = await sheet.getRows();
    await sheet.loadHeaderRow();
    const headers = sheet.headerValues || [];

    const rowsToUpdate = Array.isArray(processedValues[0]) ? processedValues : [processedValues];
    let updatedCount = 0;

    for (let i = 0; i < rowsToUpdate.length; i++) {
      const rowIndex = startRow + i;
      if (rowIndex < rows.length) {
        const row = rows[rowIndex];
        const rowData = rowsToUpdate[i];
        
        rowData.forEach((value: any, colIndex: number) => {
          const header = headers[colIndex];
          if (header) {
            row.set(header, value);
          }
        });
        
        await row.save();
        updatedCount++;
      }
    }

    return {
      success: true,
      action: 'update',
      sheetName: sheet.title,
      updatedRows: updatedCount,
      values: processedValues
    };
  }

  private processValues(values: any[], contextData: any): any[] {
    if (!Array.isArray(values)) return values;

    return values.map(row => {
      if (Array.isArray(row)) {
        return row.map(cell => replaceVariables(String(cell), contextData));
      } else {
        return replaceVariables(String(row), contextData);
      }
    });
  }
}

export const sheetsNodeExecutor = new SheetsNodeExecutor();
