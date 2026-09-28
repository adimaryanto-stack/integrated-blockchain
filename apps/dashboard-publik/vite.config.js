import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: '.',
  publicDir: 'public',
  server: {
    port: 2019,
    strictPort: true,
    open: true,
    cors: true,
    proxy: {
      '/rest': {
        target: 'http://127.0.0.1:2021',
        changeOrigin: true,
      },
      '/api': {
        target: 'http://127.0.0.1:2021',
        changeOrigin: true,
      },
    },
  },
  build: {
    target: 'esnext',
    minify: 'esbuild',
    cssMinify: true,
    sourcemap: false,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        aliranDana: resolve(__dirname, 'aliran-dana.html'),
        audit: resolve(__dirname, 'audit.html'),
        compare: resolve(__dirname, 'compare.html'),
        provinces: resolve(__dirname, 'provinces.html'),
        statistics: resolve(__dirname, 'statistics.html'),
        funding: resolve(__dirname, 'funding.html'),
        dashboard: resolve(__dirname, 'dashboard.html'),
        reporting: resolve(__dirname, 'reporting.html'),
        faq: resolve(__dirname, 'faq.html'),
        contact: resolve(__dirname, 'contact.html'),
        detail: resolve(__dirname, 'detail-anggaran.html'),
        pantau: resolve(__dirname, 'pantau-anggaran.html'),
        peta: resolve(__dirname, 'peta-regional.html'),
        tentang: resolve(__dirname, 'tentang.html'),
        provinceDetail: resolve(__dirname, 'province-detail.html'),
        regencyDetail: resolve(__dirname, 'regency-detail.html'),
      },
      output: {
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
      },
    },
  },
});
