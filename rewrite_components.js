const fs = require('fs');
const path = require('path');

// Instead I'll load ASSETS mapping manually by reading the directory again
function toCamelCase(str) {
  let name = str.replace(/[^a-zA-Z0-9]/g, ' ').replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => {
    return index === 0 ? word.toLowerCase() : word.toUpperCase();
  }).replace(/\s+/g, '');
  if (/^\d/.test(name)) name = 'img' + name;
  return name;
}

const assetsMap = {};
function scan(dir, relativePath = '', currentObj = assetsMap) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    if (file === '.DS_Store') continue;
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      const camelCaseDirName = toCamelCase(file);
      currentObj[camelCaseDirName] = {};
      scan(fullPath, `${relativePath}${file}/`, currentObj[camelCaseDirName]);
    } else {
      const ext = path.extname(file);
      const name = path.basename(file, ext);
      const camelCaseName = toCamelCase(name);
      currentObj[camelCaseName] = `images/${relativePath}${file}`;
    }
  }
}

scan(path.join(__dirname, 'public/assets/images'));

// Find inverse mapping: Path -> ASSETS object notation
const pathToAccessor = {};
function buildPathToAccessor(obj, prefix = 'ASSETS') {
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'object') {
      buildPathToAccessor(value, `${prefix}.${key}`);
    } else {
      // value is like "images/about/team.jpg" or similar
      // We want mapping from "/assets/images/..." to "ASSETS...key"
      pathToAccessor[`/assets/${value}`] = `${prefix}.${key}`;
    }
  }
}
buildPathToAccessor(assetsMap);

const srcDir = path.join(__dirname, 'src');

function walk(dir, callback) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walk(fullPath, callback);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      callback(fullPath);
    }
  }
}

walk(srcDir, (filePath) => {
  let content = fs.readFileSync(filePath, 'utf8');
  let hasChanges = false;
  
  // Search for src="/assets/images/XXX" strings
  const regex = /src=(["'])(.*?)\1/g;
  let newContent = content;
  
  // Array of replacements needed
  const replacements = [];
  let match;
  while ((match = regex.exec(content)) !== null) {
    const fullMatch = match[0]; // e.g. src="/assets/images/about/2148920603_1.webp"
    const srcPath = match[2];
    
    if (pathToAccessor[srcPath]) {
      const accessor = pathToAccessor[srcPath];
      replacements.push({
        orig: fullMatch,
        replacement: `src={assetUrl(${accessor})}`
      });
      hasChanges = true;
    }
  }

  if (hasChanges) {
    for (const r of replacements) {
      newContent = newContent.replace(r.orig, r.replacement);
    }
    
    // Check if we need to add import { assetUrl, ASSETS } from '@/lib/assets';
    if (!newContent.includes('@/lib/assets')) {
      const importStatement = `import { assetUrl, ASSETS } from '@/lib/assets';\n`;
      // Find the last import line or just add at the top
      const lastImportIndex = newContent.lastIndexOf('import ');
      if (lastImportIndex !== -1) {
        const endOfLine = newContent.indexOf('\n', lastImportIndex);
        newContent = newContent.slice(0, endOfLine + 1) + importStatement + newContent.slice(endOfLine + 1);
      } else {
        newContent = importStatement + newContent;
      }
    }
    
    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log('Updated', filePath);
  }
});
