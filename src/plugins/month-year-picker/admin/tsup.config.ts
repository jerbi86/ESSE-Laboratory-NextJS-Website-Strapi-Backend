import { defineConfig } from 'tsup';

export default defineConfig({
    entry: ['src/index.ts'],   // admin entry
    format: ['esm'],
    splitting: true,
    sourcemap: false,
    clean: true,
    dts: false,
    outDir: '../dist',
    external: [
        'react',
        'react-dom',
        'react/jsx-runtime',
        'react-intl',
        '@strapi/design-system',   // <-- key line (prevents rewriting to subpaths)
        '@strapi/icons',
        '@strapi/helper-plugin',
        'styled-components',
    ],
});
