const esbuild = require('esbuild');

esbuild.build({
    entryPoints: ['./index.js'],  // Adjust if your entry point is different
    bundle: true,
    platform: 'node',
    target: 'node20',
    outfile: './dist/index.js',
    external: ['@prisma/client', 'aws-sdk'],  // Exclude Prisma and AWS SDK
    minify: true,
    sourcemap: false,
}).then(() => {
    console.log('Build completed successfully for Node.js 20!');
}).catch((err) => {
    console.error('Build failed:', err);
    process.exit(1);
});
