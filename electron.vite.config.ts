import { resolve } from 'path'
import { bytecodePlugin, defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'
import { sentryVitePlugin } from "@sentry/vite-plugin";

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin(), bytecodePlugin({ protectedStrings: ["JAZ^&UAKL2z"]}), sentryVitePlugin({
      org: "ynter",
      project: "electron"
    })],
    build: {
      sourcemap: true,
      rollupOptions: {
        input: {
          index: resolve('src/main/index.ts')
        }
    }
    }
  },
  preload: {
    plugins: [externalizeDepsPlugin(), bytecodePlugin({ protectedStrings: ["JAZ^&UAKL2z"]}), sentryVitePlugin({
      org: "ynter",
      project: "electron"
    })],
    build: {
      sourcemap: true,
      rollupOptions: {
        input: {
          index: resolve(__dirname, 'src/preload/index.ts')
        }
      }
    }
  },
  renderer: {
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer/src')
      }
    },
    plugins: [react(), sentryVitePlugin({
      org: "ynter",
      project: "electron"
    })],
    build: {
      sourcemap: true,
      rollupOptions: {
        input: {
          index: resolve('src/renderer/index.html')
        }
      }
    }
  }
})
