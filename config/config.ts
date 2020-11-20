import { defineConfig } from 'umi';
import defaultSettings from './defaultSettings';
import proxy from './proxy';
import routes from './routes';

const { REACT_APP_ENV } = process.env;
const localeConfig = {
  default: 'zh-CN',
  antd: true,
  baseNavigator: true,
};

const layoutConfig = {
  name: 'YIMU',
  locale: true,
  ...defaultSettings,
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
  theme: { 'primary-color': defaultSettings.primaryColor },
  esbuild: {},
  title: false,
  ignoreMomentLocale: true,
  proxy: proxy[REACT_APP_ENV || 'dev'],
  manifest: { basePath: '/' },
  exportStatic: {},
});
