const fs = require('fs');

// Read the test file
const filePath = './src/utils/machine/__tests__/VirtualMill.test.ts';
let content = fs.readFileSync(filePath, 'utf8');

// Replace all executeGCode with executeGCodeSync
content = content.replace(/executeGCode\(/g, 'executeGCodeSync(');

// Write the file back
fs.writeFileSync(filePath, content);

console.log('Replaced all executeGCode calls with executeGCodeSync in test file');
