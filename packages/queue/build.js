const esbuild = require('esbuild-wasm');
const path = require('path');

async function build() {
  try {
    await esbuild.initialize();
    
    await esbuild.build({
      // Include types as a separate entry to ensure dist/types.js exists
      entryPoints: ['src/index.ts', 'src/types.ts'],
      bundle: true,
      platform: 'node',
      format: 'cjs',
      sourcemap: true,
      target: 'node18',
      outdir: 'dist',
      external: ['@nottu/*', '@nestjs/*', 'bullmq', 'pino', 'ioredis', 'class-transformer', 'class-validator']
    });
    
    console.log('Build completed successfully');
  } catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
  }
}

build();