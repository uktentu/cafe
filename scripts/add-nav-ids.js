const fs = require('fs');
const path = require('path');

const layoutsDir = path.join(__dirname, '../src/components/menu/layouts');
const files = fs.readdirSync(layoutsDir).filter(f => f.endsWith('.tsx') && f !== 'index.ts');

let updated = 0;
for (const file of files) {
  const filePath = path.join(layoutsDir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  // Look for nav category mapping: categories.map((cat) => { ... <button key={cat.id} ... onClick={...requestJump...}
  // This varies by file, but generally it's a <button or <m.button or <a
  // We want to add id={`nav-btn-${cat.id}`}
  
  // A safer way: Find onClick={() => requestJump(cat.id)} and inject the id into that element.
  // Example: onClick={() => requestJump(cat.id)} className=... -> id={`nav-btn-${cat.id}`} onClick={() => requestJump(cat.id)} className=...
  
  const original = content;
  content = content.replace(/<button([^>]*?)onClick={\(\) => requestJump\(cat\.id\)}/g, `<button id={\`nav-btn-\${cat.id}\`}$1onClick={() => requestJump(cat.id)}`);
  content = content.replace(/<m\.button([^>]*?)onClick={\(\) => requestJump\(cat\.id\)}/g, `<m.button id={\`nav-btn-\${cat.id}\`}$1onClick={() => requestJump(cat.id)}`);
  
  // TerrainLayout uses toggle(cat.id)
  content = content.replace(/<button([^>]*?)onClick={\(\) => toggle\(cat\.id\)}/g, `<button id={\`nav-btn-\${cat.id}\`}$1onClick={() => toggle(cat.id)}`);

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Updated ' + file);
    updated++;
  }
}
console.log('Total files updated: ' + updated);
