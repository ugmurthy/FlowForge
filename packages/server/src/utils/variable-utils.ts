/**
 * Utility functions for variable replacement and data access in workflow nodes
 */

/**
 * Get a nested value from an object using dot notation
 * @example getNestedValue(obj, 'user.profile.name') -> obj.user.profile.name
 */
export function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : undefined;
  }, obj);
}

/**
 * Replace variables in a template string with values from context data
 * @example replaceVariables('Hello ${user.name}', data) -> 'Hello John'
 */
export function replaceVariables(template: string, contextData: any): string {
  let result = template;
  const variables = template.match(/\${([^}]+)}/g) || [];
  
  for (const variable of variables) {
    const varName = variable.slice(2, -1); // Remove ${ and }
    const value = getNestedValue(contextData, varName) || '';
    result = result.replace(variable, String(value));
  }
  
  return result;
}
