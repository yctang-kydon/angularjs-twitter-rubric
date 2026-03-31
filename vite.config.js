import { defineConfig } from 'vite';

export default defineConfig ({
    root: '.',
    base: '/angularjs-twitter-rubric/', 

    build: {
        outDir: 'dist',
        emptyOutDir: true,
    },
    server: {
        port: 8080
    }
});