import { build } from 'esbuild'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const pkg = JSON.parse(
  readFileSync(resolve(process.cwd(), 'package.json'), 'utf8')
)

// Treat all runtime deps as external so they are required at runtime
// But exclude local @nottu packages so they get bundled
const external = Object.keys(pkg.dependencies || {}).filter(dep => 
  !dep.startsWith('@nottu/')
)

console.log('External dependencies:', external)
console.log('All dependencies:', Object.keys(pkg.dependencies || {}))

async function run() {
  try {
    await build({
      entryPoints: ['src/main.ts'],
      outfile: 'dist/main.js',
      bundle: true,
      platform: 'node',
      format: 'cjs',
      target: ['node20'],
      sourcemap: true,
      external,
      logLevel: 'info',
      loader: {
        '.node': 'copy',
      },
    })
    console.log('Esbuild: build completed.')
  } catch (err) {
    console.error('Esbuild: build failed:', err)
    process.exit(1)
  }
}

run()