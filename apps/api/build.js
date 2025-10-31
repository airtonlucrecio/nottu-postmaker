const esbuild = require('esbuild-wasm');
const path = require('path');

async function build() {
  try {
    await esbuild.initialize();
    
    await esbuild.build({
      entryPoints: ['src/main.ts'],
      bundle: true,
      platform: 'node',
      target: 'node18',
      format: 'cjs',
      outdir: 'dist',
      external: [
        '@nottu/*',
        '@nestjs/*',
        '@fastify/*',
        'class-transformer',
        'class-validator',
        'axios',
        'date-fns',
        'openai',
        'pino',
        'pino-pretty',
        'puppeteer',
        'sharp',
        'uuid'
      ],
      sourcemap: false,
      minify: false,
      keepNames: true,
      metafile: false,
      logLevel: 'info'
    });
    
    console.log('Build completed successfully');
  } catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
  }
}

build();