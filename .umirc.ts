import routes from "./src/routes";

export default {
  hash: true,
  antd: {},
  dva: {
    hmr: true,
  },
  layout: {
    name: "YIMU",
    locale: true,
  },
  locale: {
    default: "zh-CN",
    antd: true,
    baseNavigator: true,
  },
  dynamicImport: { loading: "@ant-design/pro-layout/es/PageLoading" },
  targets: { ie: 11 },
  routes,
  theme: { "primary-color": "#1890ff" },
  esbuild: {},
  title: false,
  ignoreMomentLocale: true,
  proxy: {
    "/api/": {
      target: "http://localhost:3000",
      changeOrigin: true,
      pathRewrite: { "^": "" },
    },
  },
  manifest: { basePath: "/" },
  exportStatic: {},
  outputPath: "dist/web",
  request: {
    dataField: '',
  },
};
