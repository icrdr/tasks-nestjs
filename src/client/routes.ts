export default [
  {
    path: '/login',
    component: 'layout/base.layout',
    layout: false,
    routes: [{ component: 'auth/login.page' }],
  },
  {
    path: '/signup',
    component: 'layout/base.layout',
    layout: false,
    routes: [{ component: 'auth/signup.page' }],
  },
  {
    path: '/me',
    name: 'me',
    component: 'me/me.page',
    hideInMenu: true,
  },
  {
    path: '/setting',
    name: 'setting',
    icon: 'SettingOutlined',
    component: 'setting/setting.page',
    access: 'isSpaceAdmin',
  },
  {
    path: '/member',
    name: 'member',
    icon: 'UserOutlined',
    component: 'member/member.page',
    access: 'isSpaceAdmin',
  },
  {
    path: '/task',
    name: 'task',
    icon: 'ContainerOutlined',
    component: 'task/task.page',
    access: 'hasSpace',
  },
  {
    path: '/task/:id',
    name: 'task.detail',
    component: 'task/taskDetail.page',
    hideInMenu: true,
    parentKeys: ['/task'],
    routes: [
      { path: '/task/:id/content', component: 'task/taskContent.page' },
      { path: '/task/:id/asset', component: 'asset/components/AssetView' },
    ],
    access: 'hasSpace',
  },
  {
    path: '/asset',
    name: 'asset',
    icon: 'PictureOutlined',
    component: 'asset/asset.page',
    access: 'hasSpace',
  },
  {
    path: '/exception',
    layout: false,
    routes: [
      {
        path: '/exception/404',
        component: 'exception/404',
      },
    ],
  },
  {
    path: '/',
    redirect: '/me',
  },
  {
    redirect: '/exception/404',
  },
];
