import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig( {
    build: {
        sourcemap: true,
        lib: {
            entry: resolve( __dirname, 'src/index.ts' ),
            name: 'Vanilact',
        },
        rollupOptions: {
            output: [
                {
                    format: 'es',
                    entryFileNames: 'vanilact.js',
                },
                {
                    format: 'es',
                    entryFileNames: 'vanilact.min.js',
                    plugins: [
                        require( 'rollup-plugin-terser' ).terser()
                    ]
                }
            ]
        },
        minify: false
    }
} );