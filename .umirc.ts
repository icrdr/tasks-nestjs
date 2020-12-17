import routes from "./src/routes";
import darkTheme from "@ant-design/dark-theme";
export default {
  define: {
    "process.env.OSS_REGION": process.env.OSS_REGION,
    "process.env.OSS_ACCESSKEYID": process.env.OSS_ACCESSKEYID,
    "process.env.OSS_ACCESSKEYSECRET": process.env.OSS_ACCESSKEYSECRET,
    "process.env.OSS_BUCKET": process.env.OSS_BUCKET,
    "process.env.JWT_SECRET": process.env.JWT_SECRET,
  },
  hash: true,
  antd: {},
  dva: {
    hmr: true,
  },
  cssLoader: {
    localsConvention: "camelCase",
  },
  layout: {
    name: "YIMU",
    locale: true,
    navTheme: "realDark",
    primaryColor: "#13C2C2",
    layout: "side",
    contentWidth: "Fluid",
    fixedHeader: false,
    fixSiderbar: true,
    pwa: false,
    iconfontUrl: "",
    splitMenus: false,
  },
  locale: {
    default: "zh-CN",
    antd: true,
    baseNavigator: true,
  },
  dynamicImport: { loading: "@ant-design/pro-layout/es/PageLoading" },
  targets: { ie: 11 },
  routes,
  theme: {
    ...darkTheme,
    "primary-color": "#13C2C2",
  },
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
    dataField: "",
  },
};
