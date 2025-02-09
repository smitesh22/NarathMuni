const esbuild = require('esbuild');

esbuild.build({
    entryPoints: ['./index.js'],  // Your main entry point
    bundle: true,
    platform: 'node',
    target: 'node20',
    outfile: './dist/index.js',
    external: ['@prisma/client', 'aws-sdk'],  // These should NOT be bundled
    minify: true,
    sourcemap: false,
}).then(() => {
    console.log('✅ Build completed successfully for Node.js 20!');
}).catch((err) => {
    console.error('❌ Build failed:', err);
    process.exit(1);
});
