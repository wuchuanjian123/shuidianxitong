import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import path from "path";

async function loadECharts() {
  const echarts = await import("echarts/core");
  const { LineChart } = await import("echarts/charts");
  const { TooltipComponent, GridComponent } = await import(
    "echarts/components"
  );
  const { CanvasRenderer } = await import("echarts/renderers");

  echarts.use([LineChart, TooltipComponent, GridComponent, CanvasRenderer]);
  return echarts;
}

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          echarts: [
            "echarts/core",
            "echarts/charts",
            "echarts/components",
            "echarts/renderers",
          ],
          vue: ["vue", "vue-router"],
          axios: ["axios"],
        },
      },
    },
    chunkSizeWarningLimit: 1000, // 单位为 KB
  },
});
