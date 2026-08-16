const fs = require('fs');
const path = require('path');

function searchInDir(dir, pattern, results = []) {
  try {
    const files = fs.readdirSync(dir);
    for (const f of files) {
      if (f === 'node_modules' || f === '.next' || f === '.git') continue;
      const full = path.join(dir, f);
      const stat = fs.statSync(full);
      if (stat.isDirectory()) {
        searchInDir(full, pattern, results);
      } else if (stat.isFile() && (f.endsWith('.ts') || f.endsWith('.tsx') || f.endsWith('.js') || f.endsWith('.json') || f.endsWith('.md'))) {
        try {
          const content = fs.readFileSync(full, 'utf8');
          if (content.includes(pattern)) {
            results.push(full);
          }
        } catch(e) {}
      }
    }
  } catch(e) {}
  return results;
}

const found = searchInDir('d:\\DaVinci\\Web Development', '024029');
console.log('Files containing 024029:', found);
