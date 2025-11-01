const esbuild = require('esbuild');
const path = require('path');

async function build() {
  try {
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
        'class-transformer',
        'class-validator',
        'axios',
        'date-fns',
        'openai',
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