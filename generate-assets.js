const fs = require('fs');
const path = require('path');

const publicImagesDir = path.join(__dirname, 'public/assets/images');

function toCamelCase(str) {
  // If numeric start, prefix with img
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
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
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

scan(publicImagesDir);

let content = `// Auto-generated assets file
import { env } from '@/lib/env';

export const ASSETS_URL = env.NEXT_PUBLIC_ASSETS_URL || '';

export const assetUrl = (path: string) => {
  if (ASSETS_URL) {
    return \`\${ASSETS_URL}/\${path}\`;
  }
  // Fallback for local development if ASSETS_URL is empty
  return \`/assets/\${path}\`;
};

export const ASSETS = ${JSON.stringify(assetsMap, null, 2)};
`;

fs.writeFileSync(path.join(__dirname, 'src/lib/assets.ts'), content);
console.log('Generated src/lib/assets.ts');

