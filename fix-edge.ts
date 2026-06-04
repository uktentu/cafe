import fs from 'fs';
import path from 'path';

function addEdgeRuntime(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  if (!content.includes("export const runtime = 'edge'")) {
    fs.writeFileSync(filePath, "export const runtime = 'edge'\n" + content);
    console.log(`Updated ${filePath}`);
  }
}

addEdgeRuntime('src/app/(cms)/cms/(app)/layout.tsx');
addEdgeRuntime('src/app/api/items/[id]/avail/route.ts');
addEdgeRuntime('src/app/api/items/avail/route.ts');
addEdgeRuntime('src/app/api/revalidate/route.ts');
addEdgeRuntime('src/app/api/track/route.ts');

// Note: /api/upload uses sharp, which won't work on edge. 
// We will also add edge to it, but it will likely crash if it uses sharp at runtime.
addEdgeRuntime('src/app/api/upload/route.ts');
