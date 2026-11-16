import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

// start-permease.bat sets VITE_DEV_HOST to this PC's network IP so phones can load assets
const devHost = process.env.VITE_DEV_HOST;

export default defineConfig({
    plugins: [
        laravel({
            input: ['resources/css/app.css', 'src/main.tsx'],
            refresh: true,
        }),
        react(),
        tailwindcss(),
    ],
    build: {
        emptyOutDir: false,
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
    server: {
        host: '0.0.0.0',
        port: 5173,
        strictPort: true,
        cors: true,
        origin: devHost ? `http://${devHost}:5173` : undefined,
        hmr: devHost ? { host: devHost } : undefined,
        watch: {
            ignored: ['**/storage/framework/views/**'],
        },
    },
});