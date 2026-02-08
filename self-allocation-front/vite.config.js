import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
    AutoImport({
      resolvers: [ElementPlusResolver()],
    }),
    Components({
      resolvers: [ElementPlusResolver()],
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    proxy: {
      '/show': {
        target: 'http://192.168.31.35:3100',
        changeOrigin: true,
        secure: false,
      },
      '/render': {
        target: 'http://192.168.31.35:3200',
        changeOrigin: true,
        secure: false,
      },
      '/ai': {
        target: 'http://192.168.31.35:3200',
        changeOrigin: true,
        secure: false,
      },
      '/ws': {
        // WebSocket代理配置
        target: 'ws://192.168.31.35:3100',
        ws: true, // 启用websocket
        changeOrigin: true,
        secure: false,
      },
      '/api/generate': {
        target: 'http://10.1.112.46:11434',
        changeOrigin: true,
        secure: false,
      },
      '/simulation': {
        target: 'http://192.168.31.35:3200',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        // 如果需要全局引入变量或 mixin
        // additionalData: `@use "@/assets/styles/_variables.scss" as *;`
      },
    },
  },
})
