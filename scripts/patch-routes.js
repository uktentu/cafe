const fs = require('fs')
const path = '.vercel/output/static/_routes.json'
try {
  const data = JSON.parse(fs.readFileSync(path, 'utf8'))
  // Replace the generated include/exclude with exact includes for our dynamic routes
  data.include = [
    "/api/*",
    "/cms/*",
    "/cms"
  ]
  data.exclude = []
  fs.writeFileSync(path, JSON.stringify(data, null, 2))
  console.log('Successfully patched _routes.json to only include /api and /cms')
} catch (err) {
  console.error('Failed to patch _routes.json:', err.message)
}
