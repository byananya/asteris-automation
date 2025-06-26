// This script adds .js extensions to all relative imports in the compiled JS files
const fs = require('fs');
const path = require('path');

const distDir = path.join(__dirname, 'dist');

function processFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const fixedContent = content.replace(
    /from ['"](\..*?)(?:\.js)?['"]/g,
    (match, p1) => `from '${p1}.js'`
  );
  fs.writeFileSync(filePath, fixedContent, 'utf8');
}

function processDirectory(directory) {
  const files = fs.readdirSync(directory);
  
  files.forEach(file => {
    const fullPath = path.join(directory, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      processDirectory(fullPath);
    } else if (file.endsWith('.js')) {
      processFile(fullPath);
    }
  });
}

processDirectory(distDir);
console.log('Fixed import extensions in compiled files');
