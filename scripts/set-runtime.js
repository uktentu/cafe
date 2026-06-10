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
        if (!file.includes('(menu)/page.tsx')) {
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
