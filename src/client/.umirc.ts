import routes from "./routes";
import darkTheme from "@ant-design/dark-theme";

export default {
  define: {
    "process.env.WS": process.env.WS,
  },
  alias: {
    "@utils": process.cwd() + "/src/utils",
    "@dtos": process.cwd() + "/src/dtos",
    "@server": process.cwd() + "/src/server",
    "@pages": process.cwd() + "/src/client/pages",
    "@components": process.cwd() + "/src/client/components",
    "@hooks": process.cwd() + "/src/client/hooks",
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
    navTheme: "light",
    primaryColor: "#13C2C2",
    layout: "side",
    contentWidth: "Fluid",
    fixedHeader: false,
    fixSiderbar: true,
    pwa: false,
    iconfontUrl: "",
    splitMenus: false,
    breakpoint: false,
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
    // ...darkTheme,
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
  outputPath: "../../dist/client",
  request: {
    dataField: "",
  },
};
