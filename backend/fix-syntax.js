const fs = require('fs');
const path = require('path');

const dirs = ['./services', './jobs', './middleware', './controllers', './routes', './config'];

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  // Replace escaped backticks and escaped dollar signs in template literals
  // regex to find \` and replace with `
  // regex to find \${ and replace with ${
  const fixed = content.replace(/\\`/g, '`').replace(/\\\$/g, '$');
  
  if (content !== fixed) {
    console.log(`Fixing: ${filePath}`);
    fs.writeFileSync(filePath, fixed, 'utf8');
  }
}

function processDir(dir) {
  const absoluteDir = path.resolve(__dirname, dir);
  if (!fs.existsSync(absoluteDir)) return;
  
  const files = fs.readdirSync(absoluteDir);
  files.forEach(file => {
    const fullPath = path.join(absoluteDir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      processDir(path.join(dir, file));
    } else if (file.endsWith('.js')) {
      fixFile(fullPath);
    }
  });
}

dirs.forEach(processDir);
console.log('Syntax fix complete.');
