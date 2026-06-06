const fs = require('fs')
const path = require('path')

function walk(dir) {
  let results = []
  const list = fs.readdirSync(dir)
  list.forEach(file => {
    file = path.join(dir, file)
    const stat = fs.statSync(file)
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file))
    } else {
      if (file.endsWith('.tsx') || file.endsWith('.ts')) {
        results.push(file)
      }
    }
  })
  return results
}

const files = [...walk('src/components/cms'), ...walk('src/app/(cms)')]

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8')
  let newContent = content
    // Backgrounds
    .replace(/bg-\[\#F7F8FA\]/g, 'bg-[#F7F8FA] dark:bg-neutral-950')
    .replace(/bg-white(?!\/)/g, 'bg-white dark:bg-neutral-900')
    .replace(/bg-neutral-50(?!\/)/g, 'bg-neutral-50 dark:bg-neutral-800/50')
    // Text
    .replace(/text-neutral-900/g, 'text-neutral-900 dark:text-neutral-100')
    .replace(/text-neutral-800/g, 'text-neutral-800 dark:text-neutral-200')
    .replace(/text-neutral-700/g, 'text-neutral-700 dark:text-neutral-300')
    .replace(/text-neutral-600/g, 'text-neutral-600 dark:text-neutral-400')
    .replace(/text-neutral-500/g, 'text-neutral-500 dark:text-neutral-400')
    .replace(/text-black/g, 'text-black dark:text-white')
    // Borders & Rings
    .replace(/ring-black\/5/g, 'ring-black/5 dark:ring-white/10')
    .replace(/ring-black\/10/g, 'ring-black/10 dark:ring-white/20')
    .replace(/border-neutral-200/g, 'border-neutral-200 dark:border-neutral-800')
    .replace(/border-neutral-300/g, 'border-neutral-300 dark:border-neutral-700')
    
  if (content !== newContent) {
    fs.writeFileSync(file, newContent)
    console.log('Updated ' + file)
  }
})
