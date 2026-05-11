const fs = require('fs');
let f = fs.readFileSync('generate-schemas.js', 'utf8');
f = f.replace(/\\`/g, '`');
fs.writeFileSync('generate-schemas.js', f);
console.log('Fixed');
