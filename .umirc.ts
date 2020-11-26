import { defineConfig } from 'umi';
import routes from './src/routes';

const proxy = {
  dev: {
    '/api/': {
      target: 'http://localhost:3000',
      changeOrigin: true,
      pathRewrite: { '^': '' },
    },
  },
  test: {
    '/api/': {
      target: 'http://localhost:3000',
      changeOrigin: true,
      pathRewrite: { '^': '' },
    },
  },
};

const { REACT_APP_ENV } = process.env;
const localeConfig = {
  default: 'zh-CN',
  antd: true,
  baseNavigator: true,
};

const layoutConfig = {
  name: 'YIMU',
  locale: true,
};

export default defineConfig({
  hash: true,
  antd: {},
  dva: {
    hmr: true,
  },
  layout: layoutConfig,
  locale: localeConfig,
  dynamicImport: { loading: '@ant-design/pro-layout/es/PageLoading' },
  targets: { ie: 11 },
  routes,
  theme: { 'primary-color': '#1890ff' },
  esbuild: {},
  title: false,
  ignoreMomentLocale: true,
  proxy: proxy[REACT_APP_ENV || 'dev'],
  manifest: { basePath: '/' },
  exportStatic: {},
  outputPath: 'dist/web',
});
