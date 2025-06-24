import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig( {
    build: {
        lib: {
            entry: resolve( __dirname, 'src/index.ts' ),
            name: 'Vanilact',
            formats: [ 'es', 'umd' ],
        },
        rollupOptions: {
            output: [
                {
                    format: 'es',
                    entryFileNames: 'vanilact.js',
                    sourcemap: true,
                },
                {
                    format: 'es',
                    entryFileNames: 'vanilact.min.js',
                    sourcemap: false,
                    plugins: [
                        require( 'rollup-plugin-terser' ).terser()
                    ]
                }
            ]
        },
        minify: false
    }
} );