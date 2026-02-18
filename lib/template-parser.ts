export function replaceVariables(template: string, data: Record<string, string>): string {
  let result = template;

  // Create a case-insensitive lookup map
  const dataLowerCase: Record<string, string> = {};
  Object.entries(data).forEach(([key, value]) => {
    dataLowerCase[key.toLowerCase()] = value;
  });

  // Replace variables case-insensitively
  result = result.replace(/{{(\w+)}}/g, (match, key) => {
    return dataLowerCase[key.toLowerCase()] || match;
  });

  return result;
}

export function parseConditionalContent(template: string, data: Record<string, string>): string {
  // Create a case-insensitive lookup map
  const dataLowerCase: Record<string, string> = {};
  Object.entries(data).forEach(([key, value]) => {
    dataLowerCase[key.toLowerCase()] = value;
  });

  // Simple conditional: {{#if company}}text{{/if}}
  const ifRegex = /{{#if\s+(\w+)}}([\s\S]*?){{\/if}}/g;
  return template.replace(ifRegex, (match, field, content) => {
    return dataLowerCase[field.toLowerCase()] ? content : '';
  });
}
