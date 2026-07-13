import { readFileSync } from 'fs'

const data = JSON.parse(readFileSync('./dist/stats.json', 'utf8'))

const parts = data.nodeParts   // uid -> {renderedLength, metaUid}
const metas = data.nodeMetas   // metaUid -> {id: filepath}

const packages = {}
let total = 0

for (const part of Object.values(parts)) {
  const size = part.renderedLength || 0
  total += size
  const meta = part.metaUid ? metas[part.metaUid] : null
  if (!meta || !meta.id) {
    packages['[unknown]'] = (packages['[unknown]'] || 0) + size
    continue
  }
  const id = meta.id.replaceAll('\\', '/')
  const match = id.match(/node_modules\/(@[^/]+\/[^/]+|[^/]+)/)
  const key = match ? match[1] : 'app-code'
  packages[key] = (packages[key] || 0) + size
}

const sorted = Object.entries(packages).sort((a, b) => b[1] - a[1])
console.log(`Total rendered: ${(total / 1024 / 1024).toFixed(2)} MB`)
console.log('')
sorted.slice(0, 30).forEach(([name, size]) => {
  const kb = (size / 1024).toFixed(0)
  const pct = ((size / total) * 100).toFixed(1)
  console.log(`${pct.padStart(5)}%  ${kb.padStart(7)} KB  ${name}`)
})
