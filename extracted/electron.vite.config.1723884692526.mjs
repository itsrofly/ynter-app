// electron.vite.config.ts
import { resolve } from "path";
import { defineConfig, externalizeDepsPlugin } from "electron-vite";
import react from "@vitejs/plugin-react";
import { sentryVitePlugin } from "@sentry/vite-plugin";
var __electron_vite_injected_dirname = "C:\\Users\\ynter\\Documents\\Projects\\Ynter\\ynter";
var electron_vite_config_default = defineConfig({
  main: {
    plugins: [externalizeDepsPlugin(), sentryVitePlugin({
      org: "ynter",
      project: "electron"
    })],
    build: {
      sourcemap: true,
      rollupOptions: {
        input: {
          index: resolve("src/main/index.ts")
        }
      }
    }
  },
  preload: {
    plugins: [externalizeDepsPlugin(), sentryVitePlugin({
      org: "ynter",
      project: "electron"
    })],
    build: {
      sourcemap: true,
      rollupOptions: {
        input: {
          index: resolve(__electron_vite_injected_dirname, "src/preload/index.ts")
        }
      }
    }
  },
  renderer: {
    resolve: {
      alias: {
        "@renderer": resolve("src/renderer/src")
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
          index: resolve("src/renderer/index.html")
        }
      }
    }
  }
});
export {
  electron_vite_config_default as default
};
