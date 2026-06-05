const fs = require('fs');
const path = require('path');

const layoutsDir = path.join(__dirname, '../src/components/menu/layouts');
const files = ['EmberLayout.tsx', 'SakuraLayout.tsx', 'BazaarLayout.tsx', 'NocturneLayout.tsx'];

for (const file of files) {
  const filePath = path.join(layoutsDir, file);
  if (!fs.existsSync(filePath)) continue;
  let content = fs.readFileSync(filePath, 'utf8');

  // Find onClick={() => requestJump(c.id)}
  content = content.replace(/<button([^>]*?)onClick={\(\) => requestJump\(c\.id\)}/g, `<button id={\`nav-btn-\${c.id}\`}$1onClick={() => requestJump(c.id)}`);
  content = content.replace(/<m\.button([^>]*?)onClick={\(\) => requestJump\(c\.id\)}/g, `<m.button id={\`nav-btn-\${c.id}\`}$1onClick={() => requestJump(c.id)}`);
  
  fs.writeFileSync(filePath, content, 'utf8');
}
console.log('Updated second batch');
