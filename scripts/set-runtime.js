const fs = require('fs')
const path = require('path')

let targetRuntime = process.argv[2] // 'edge', 'remove', or 'auto'

if (targetRuntime === 'auto') {
  targetRuntime = 'remove'
}

if (!['edge', 'remove'].includes(targetRuntime)) {
  console.error('Usage: node set-runtime.js <edge|remove|auto>')
  process.exit(1)
}

// Static export (GitHub Pages demo) cannot prerender edge-runtime pages in Node.js.
// When STATIC_EXPORT=1 and the caller asked for 'edge', strip instead of injecting.
if (targetRuntime === 'edge' && process.env.STATIC_EXPORT === '1') {
  console.log('STATIC_EXPORT=1 — stripping edge runtime for static build')
  targetRuntime = 'remove'
}

function walk(dir) {
  let results = []
  const list = fs.readdirSync(dir)
  list.forEach((file) => {
    file = path.join(dir, file)
    const stat = fs.statSync(file)
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file))
    } else {
      if (file.endsWith('page.tsx') || file.endsWith('route.ts')) {
        // The public menu (/(menu)/page.tsx) must be edge so Cloudflare renders it
        // dynamically (fresh data). Only the loyalty page stays static ISR.
        if (!file.includes('/(menu)/loyalty/')) {
          results.push(file)
        }
      }
    }
  })
  return results
}

const files = walk('./src/app')

files.forEach((file) => {
  let content = fs.readFileSync(file, 'utf8')
  const hasRuntimeEdge = content.includes('export const runtime = "edge"') || content.includes("export const runtime = 'edge'")
  
  if (targetRuntime === 'edge' && !hasRuntimeEdge) {
    fs.appendFileSync(file, '\nexport const runtime = "edge";\n')
    console.log(`Added edge runtime to ${file}`)
  } else if (targetRuntime === 'remove') {
    let newContent = content
      .replace(/\nexport const runtime = "edge";\n/g, '')
      .replace(/\nexport const runtime = 'edge';\n/g, '')
      .replace(/export const runtime = "edge"/g, '')
      .replace(/export const runtime = 'edge'/g, '')
    if (newContent !== content) {
      fs.writeFileSync(file, newContent)
      console.log(`Removed runtime from ${file}`)
    }
  }
})
