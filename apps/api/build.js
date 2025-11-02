const esbuild = require('esbuild');
const path = require('path');

async function run() {
  const isWatch = process.argv.includes('--watch') || process.env.WATCH === 'true';
  const commonOptions = {
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
      'uuid',
      'reflect-metadata'
    ],
    sourcemap: isWatch ? 'inline' : false,
    minify: false,
    keepNames: true,
    metafile: false,
    logLevel: 'info'
  };

  try {
    if (isWatch) {
      const ctx = await esbuild.context(commonOptions);
      await ctx.watch();
      console.log('esbuild is watching for changes...');
    } else {
      await esbuild.build(commonOptions);
      console.log('Build completed successfully');
    }
  } catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
  }
}

run();