import vue from "@vitejs/plugin-vue";
import { resolve } from "path";
import { defineConfig, loadEnv } from "vite";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    plugins: [
      vue(),
      {
        name: 'html-transform',
        transformIndexHtml(html) {
          return html.replace(
            '%VITE_BACKEND_URL%',
            env.VITE_BACKEND_URL || 'http://localhost:8080'
          );
        }
      }
    ],
    resolve: {
      alias: {
        "@": resolve(__dirname, "src"),
      },
    },
  };
});
